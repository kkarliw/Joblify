import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, Eye, EyeOff, ChevronLeft, ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, homeForRole, type UserRole } from "@/store/authStore";
import { authApi, API_URL } from "@/lib/api";
import { toast } from "sonner";

// Opciones categorizadas para áreas profesionales
const CATEGORIAS_TRABAJO = [
  {
    categoria: "Tecnología",
    opciones: ["Desarrollador Frontend", "Desarrollador Backend", "Desarrollador Full Stack", "Mobile Developer", "DevOps Engineer", "Data Scientist", "UX/UI Designer", "Product Manager", "QA Engineer", "CTO"]
  },
  {
    categoria: "Diseño",
    opciones: ["Diseñador Gráfico", "Diseñador de Producto", "Diseñador Web", "Ilustrador", "Motion Designer", "Diseñador 3D", "Director de Arte"]
  },
  {
    categoria: "Marketing",
    opciones: ["Marketing Manager", "Growth Hacker", "Content Manager", "Social Media Manager", "SEO Specialist", "Brand Manager", "CMO"]
  },
  {
    categoria: "Negocios",
    opciones: ["CEO", "Founder", "Co-Founder", "Business Developer", "Sales Manager", "Operations Manager", "Project Manager", "Consultor"]
  },
  {
    categoria: "Finanzas",
    opciones: ["CFO", "Analista Financiero", "Contador", "Controller", "Inversionista"]
  },
  {
    categoria: "Recursos Humanos",
    opciones: ["HR Manager", "Talent Acquisition", "People Operations", "CHRO"]
  },
  {
    categoria: "Otros",
    opciones: ["Abogado", "Redactor", "Traductor", "Fotógrafo", "Videógrafo", "Community Manager", "Customer Success"]
  }
];

// Ciudades principales de Colombia (alcance inicial)
const CIUDADES = [
  "Bogotá, Colombia",
  "Medellín, Colombia",
  "Cali, Colombia",
  "Barranquilla, Colombia",
  "Cartagena, Colombia",
  "Bucaramanga, Colombia",
  "Pereira, Colombia",
  "Manizales, Colombia",
  "Santa Marta, Colombia",
  "Cúcuta, Colombia",
  "Ibagué, Colombia",
  "Villavicencio, Colombia",
  "Pasto, Colombia",
  "Montería, Colombia",
  "Armenia, Colombia",
  "Remote / Remoto",
  "Otra"
];

type RoleKey = "candidato" | "empresa" | "freelancer" | "emprendedor" | "estudiante";

const ROLE_CONFIG: Record<RoleKey, { label: string; desc: string }> = {
  candidato: { label: "Talento", desc: "Encuentra tu próximo trabajo ideal" },
  empresa: { label: "Empresa", desc: "Publica vacantes y encuentra talento" },
  freelancer: { label: "Freelancer", desc: "Ofrece tus servicios profesionales" },
  emprendedor: { label: "Emprendedor", desc: "Conecta con co-founders y talento" },
  estudiante: { label: "Estudiante", desc: "Encuentra prácticas y mentorías" },
};

const ACCOUNT_NAME_LABEL: Record<RoleKey, string> = {
  candidato: "Nombre completo",
  empresa: "Nombre del reclutador/a",
  freelancer: "Nombre completo",
  emprendedor: "Nombre del fundador/a",
  estudiante: "Nombre completo",
};

const ACCOUNT_NAME_PLACEHOLDER: Record<RoleKey, string> = {
  candidato: "María González",
  empresa: "Laura Pérez",
  freelancer: "María González",
  emprendedor: "Juan Rodríguez",
  estudiante: "María González",
};

const ACCOUNT_STEP_COPY: Record<RoleKey, string> = {
  candidato: "Configura tus datos de acceso para comenzar a postularte.",
  empresa: "Configura tu cuenta y el contacto principal de reclutamiento.",
  freelancer: "Configura tu cuenta para ofrecer tus servicios.",
  emprendedor: "Configura tu cuenta para lanzar tu proyecto.",
  estudiante: "Configura tu cuenta para buscar prácticas y mentorías.",
};

const PROFILE_STEP_COPY: Record<RoleKey, string> = {
  candidato: "Esto ayuda a las empresas a conocerte mejor.",
  empresa: "Completa los datos de tu empresa para publicar vacantes.",
  freelancer: "Completa tu perfil para atraer mejores clientes.",
  emprendedor: "Completa tu perfil para conectar con talento clave.",
  estudiante: "Completa tu perfil para encontrar prácticas alineadas.",
};

const RegisterClean = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const stepFromUrl = params.get("step");
  const emailFromUrl = params.get("email")?.trim() || "";
  const role = (params.get("role") || "candidato") as RoleKey;
  
  const [step, setStep] = useState<"account" | "profile" | "verify">(
    stepFromUrl === "verify" && emailFromUrl ? "verify" : "account"
  );
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendTimer, setResendTimer] = useState(stepFromUrl === "verify" && emailFromUrl ? 0 : 60);
  
  const [form, setForm] = useState({
    name: "",
    email: emailFromUrl,
    password: "",
    headline: "",
    location: "",
    // Campos específicos por rol
    experienceYears: "",
    availability: "",
    expectedSalary: "",
    modalityPref: "",
    companyName: "",
    industry: "",
    companySize: "",
    hourlyRate: "",
    bio: "",
    projectName: "",
    institution: "",
    career: "",
    semester: "",
    weeklyHours: "",
  });

  // Timer para reenviar codigo
  useEffect(() => {
    if (step === "verify" && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendTimer]);

  useEffect(() => {
    if (stepFromUrl === "verify" && emailFromUrl) {
      setStep("verify");
      setResendTimer(0);
      setForm(prev => ({ ...prev, email: emailFromUrl }));
    }
  }, [stepFromUrl, emailFromUrl]);
  
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.candidato;
  
  const handleNext = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Completa nombre y email");
      return;
    }

    if (form.password.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    if (role === "empresa" && !form.companyName.trim()) {
      toast.error("Completa el nombre de la empresa");
      return;
    }

    setStep("profile");
  };
  
  const handleSubmit = async () => {
    if (!form.headline || !form.location) {
      toast.error("Completa tu perfil");
      return;
    }
    
    // Validar campos especificos segun el rol
    let roleSpecificData: Record<string, unknown> = {};
    
    if (role === "candidato") {
      if (!form.experienceYears || !form.availability) {
        toast.error("Completa tus años de experiencia y disponibilidad");
        return;
      }
      roleSpecificData = {
        experienceYears: parseInt(form.experienceYears) || 0,
        availability: form.availability,
        expectedSalary: parseInt(form.expectedSalary) || null,
        modalityPref: form.modalityPref,
      };
    } else if (role === "empresa") {
      if (!form.companyName || !form.industry) {
        toast.error("Completa el nombre de la empresa e industria");
        return;
      }
      roleSpecificData = {
        companyName: form.companyName,
        industry: form.industry,
        companySize: form.companySize,
      };
    } else if (role === "freelancer") {
      if (!form.hourlyRate) {
        toast.error("Indica tu tarifa por hora");
        return;
      }
      roleSpecificData = {
        hourlyRate: parseInt(form.hourlyRate) || 0,
        services: [], // Se completara despues
      };
    } else if (role === "emprendedor") {
      if (!form.bio) {
        toast.error("Escribe una breve descripcion de ti");
        return;
      }
      roleSpecificData = {
        bio: form.bio,
        industries: form.industry ? [form.industry] : [],
        projectName: form.projectName,
      };
    } else if (role === "estudiante") {
      if (!form.institution || !form.career) {
        toast.error("Completa tu institucion y carrera");
        return;
      }
      roleSpecificData = {
        institution: form.institution,
        career: form.career,
        semester: parseInt(form.semester) || null,
        internshipType: form.availability,
        weeklyHours: parseInt(form.weeklyHours) || null,
      };
    }
    
    console.log("[FRONTEND] Enviando registro con rol:", role, "profileData:", roleSpecificData);
    
    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        name: form.name,
        role,
        headline: form.headline,
        location: form.location,
        profileData: roleSpecificData,
      });

      // Ir a paso de verificacion
      setStep("verify");
      setResendTimer(60);
      toast.success("Te enviamos un codigo de verificacion a tu email");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || (err instanceof Error ? err.message : "Error");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Ingresa el codigo de 6 digitos");
      return;
    }

    if (!form.email.trim()) {
      toast.error("No encontramos tu email. Vuelve a iniciar sesión.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.verifyEmail({ email: form.email.trim(), code: verificationCode });
      const normalizedUser = { ...data.user, role: data.user.role.toLowerCase() };
      
      localStorage.setItem("joblify.token", data.accessToken);
      localStorage.setItem("joblify.refresh", data.refreshToken);
      
      useAuthStore.setState({
        user: normalizedUser,
        token: data.accessToken,
        refreshToken: data.refreshToken,
      });
      
      toast.success("Email verificado. Bienvenido a Joblify");
      navigate(homeForRole(normalizedUser.role.toLowerCase() as UserRole), { replace: true });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || (err instanceof Error ? err.message : "Error al verificar");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    if (!form.email.trim()) {
      toast.error("No encontramos tu email. Vuelve a iniciar sesión.");
      return;
    }
    
    setLoading(true);
    try {
      await authApi.resendVerification(form.email.trim());

      setResendTimer(60);
      toast.success("Nuevo codigo enviado");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || (err instanceof Error ? err.message : "Error");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[#D2D2D7] flex items-center justify-between px-6 lg:px-12">
        <Logo size="lg" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#86868B]">¿Ya tienes cuenta?</span>
          <Link
            to={`/login?role=${role}`}
            className="px-5 py-2 text-sm font-medium text-[#1D1D1F] border border-[#D2D2D7] rounded-full hover:bg-[#F5F5F7] transition-colors"
          >
            Inicia sesión
          </Link>
        </div>
      </header>

      {/* Main content - 2 columns */}
      <main className="flex-1 grid lg:grid-cols-2">
        {/* Left - Hero Visual */}
        <div className="hidden lg:flex flex-col items-center justify-center px-12 py-12 bg-[#F5F5F7]">
          <div className="max-w-md w-full flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold text-[#1D1D1F] mb-2">
              Tu talento,
            </h1>
            <h1 className="text-4xl font-bold text-[#F5A623] mb-6">
              Sin límites.
            </h1>
            <p className="text-[#86868B] mb-8 text-lg max-w-sm">
              Únete a Joblify y accede a oportunidades, herramientas y conexiones que impulsarán tu camino al éxito.
            </p>

            {/* Mascota Joblify - Hero Size */}
            <div className="relative mx-auto">
              {/* Glow effect amarillo */}
              <div className="absolute inset-0 bg-[#FFD93D]/30 rounded-full blur-[100px] scale-125"></div>
              {/* Anillos decorativos */}
              <div className="absolute inset-0 border-2 border-[#FFD93D]/20 rounded-full scale-125"></div>
              <div className="absolute inset-0 border border-[#FFD93D]/10 rounded-full scale-150"></div>
              <img 
                src="/mascot.png" 
                alt="Joblify Mascota" 
                className="relative w-80 h-80 lg:w-96 lg:h-96 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>

            {/* Info box */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FFD93D] to-[#F5A623] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-[#1D1D1F]">
                  En Joblify creemos en el talento que transforma. Elige tu rol y comienza tu mejor versión profesional.
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FFD93D] to-[#F5A623] rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F]">100% Seguro</p>
                  <p className="text-xs text-[#86868B]">Protegemos tu información</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FFD93D] to-[#F5A623] rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F]">Oportunidades reales</p>
                  <p className="text-xs text-[#86868B]">Conecta con empresas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex flex-col justify-center px-6 lg:px-12 py-8">
          <div className="max-w-md mx-auto w-full">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => step === "profile" ? setStep("account") : navigate("/register/elegir")}
                className="flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Volver</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFD93D]"></div>
                <span className="text-sm font-medium text-[#F5A623]">
                  PASO {step === "account" ? "1" : "2"} DE 2
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="mb-8">
              <p className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider mb-2">Registro</p>
              <h2 className="text-3xl font-bold text-[#1D1D1F]">
                {step === "account" ? "Crea tu cuenta" : step === "profile" ? "Completa tu perfil" : "Verifica tu email"}
              </h2>
              <p className="text-[#86868B] mt-2">
                {step === "account"
                  ? ACCOUNT_STEP_COPY[role]
                  : step === "profile"
                    ? PROFILE_STEP_COPY[role]
                    : "Confirma el código que enviamos a tu correo para activar tu cuenta."
                }
              </p>
            </div>

            {/* Role card */}
            <div className="bg-white border border-[#D2D2D7] rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FFD93D] to-[#F5A623] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  {role === "candidato" && (
                    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
                      <circle cx="20" cy="14" r="8" stroke="#1D1D1F" strokeWidth="2.5" fill="none"/>
                      <path d="M8 34 C8 26 14 22 20 22 C26 22 32 26 32 34" stroke="#1D1D1F" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      <circle cx="20" cy="14" r="3" fill="#1D1D1F"/>
                    </svg>
                  )}
                  {role === "empresa" && (
                    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
                      <rect x="8" y="12" width="24" height="20" rx="2" stroke="#1D1D1F" strokeWidth="2.5"/>
                      <rect x="12" y="22" width="6" height="6" rx="1" fill="#1D1D1F"/>
                      <rect x="22" y="22" width="6" height="6" rx="1" fill="#1D1D1F"/>
                      <path d="M16 12V8h8v4" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {role === "freelancer" && (
                    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
                      <path d="M12 20 L20 12 L28 20 L20 28 Z" stroke="#1D1D1F" strokeWidth="2.5" strokeLinejoin="round"/>
                      <circle cx="20" cy="20" r="4" fill="#1D1D1F"/>
                      <path d="M8 32 L12 28 M32 32 L28 28" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {role === "emprendedor" && (
                    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
                      <path d="M20 8 L24 16 L32 16 L26 22 L28 30 L20 25 L12 30 L14 22 L8 16 L16 16 Z" stroke="#1D1D1F" strokeWidth="2" strokeLinejoin="round" fill="#1D1D1F"/>
                      <path d="M20 8 L20 4" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M28 30 C28 34 24 36 20 36 C16 36 12 34 12 30" stroke="#1D1D1F" strokeWidth="2" fill="none"/>
                    </svg>
                  )}
                  {role === "estudiante" && (
                    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
                      <path d="M20 8 L32 14 L20 20 L8 14 Z" stroke="#1D1D1F" strokeWidth="2.5" strokeLinejoin="round"/>
                      <path d="M8 14 V24 M32 14 V24" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 20 V28 C12 30 16 32 20 32 C24 32 28 30 28 28 V20" stroke="#1D1D1F" strokeWidth="2.5" fill="none"/>
                      <circle cx="20" cy="26" r="2" fill="#1D1D1F"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#1D1D1F]">Soy {config.label}</h3>
                    {role === "candidato" && (
                      <span className="px-2 py-0.5 bg-[#FFD93D]/20 text-[#F5A623] text-xs font-medium rounded-full">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#86868B]">{config.desc}</p>
                </div>
                <button 
                  onClick={() => navigate("/register/elegir")}
                  className="text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                  aria-label="Ir a registro"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {step === "account" && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1D1D1F]">{ACCOUNT_NAME_LABEL[role]}</label>
                    <Input 
                      placeholder={ACCOUNT_NAME_PLACEHOLDER[role]} 
                      value={form.name} 
                      onChange={(e) => setForm({...form, name: e.target.value})} 
                      className="h-14 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all" 
                    />
                  </div>

                  {role === "empresa" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1D1D1F]">Nombre de la empresa</label>
                      <Input
                        placeholder="Ej: Rappi Tech"
                        value={form.companyName}
                        onChange={(e) => setForm({...form, companyName: e.target.value})}
                        className="h-14 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1D1D1F]">Email</label>
                    <Input 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={form.email} 
                      onChange={(e) => setForm({...form, email: e.target.value})} 
                      className="h-14 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1D1D1F]">Contraseña</label>
                    <div className="relative">
                      <Input 
                        type={showPw ? "text" : "password"} 
                        placeholder="Mínimo 8 caracteres" 
                        value={form.password} 
                        onChange={(e) => setForm({...form, password: e.target.value})} 
                        className="h-14 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all" 
                      />
                      <button 
                        onClick={() => setShowPw(!showPw)} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                      >
                        {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleNext} 
                  className="mt-8 w-full h-14 bg-[#1D1D1F] hover:bg-[#333] text-white rounded-xl font-semibold text-base"
                >
                  Continuar <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 h-px bg-[#D2D2D7]" />
                  <span className="text-sm text-[#86868B]">o</span>
                  <div className="flex-1 h-px bg-[#D2D2D7]" />
                </div>

                <Button
                  variant="outline"
                  onClick={() => window.location.href = `${API_URL}/auth/google`}
                  className="mt-6 w-full h-14 border-[#D2D2D7] rounded-xl font-medium text-[#1D1D1F] hover:bg-[#F5F5F7]"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </Button>
              </>
            )}

            {step === "profile" && (
              <>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Select de Área/Categoría */}
                  <div className="space-y-2">
                    <label htmlFor="area-profesional" className="text-sm font-medium text-[#1D1D1F]">Área profesional</label>
                    <div className="relative">
                      <select 
                        id="area-profesional"
                        value={form.headline} 
                        onChange={(e) => setForm({...form, headline: e.target.value})}
                        className="w-full h-14 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all cursor-pointer"
                        aria-label="Selecciona tu área profesional"
                      >
                        <option value="">Selecciona tu área profesional</option>
                        {CATEGORIAS_TRABAJO.map((cat) => (
                          <optgroup key={cat.categoria} label={cat.categoria}>
                            {cat.opciones.map((op) => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Select de Ubicación */}
                  <div className="space-y-2">
                    <label htmlFor="ubicacion" className="text-sm font-medium text-[#1D1D1F]">Ubicación</label>
                    <div className="relative">
                      <select 
                        id="ubicacion"
                        value={form.location} 
                        onChange={(e) => setForm({...form, location: e.target.value})}
                        className="w-full h-14 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all cursor-pointer"
                        aria-label="Selecciona tu ciudad"
                      >
                        <option value="">Selecciona tu ciudad</option>
                        {CIUDADES.map((ciudad) => (
                          <option key={ciudad} value={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                    </div>
                  </div>

                  {/* Campos específicos por ROL */}
                  
                  {/* CANDIDATO */}
                  {role === "candidato" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Años de experiencia</label>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="Ej: 3"
                          value={form.experienceYears} 
                          onChange={(e) => setForm({...form, experienceYears: e.target.value})}
                          className="h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="disponibilidad-candidato-2" className="text-sm font-medium text-[#1D1D1F]">Disponibilidad</label>
                        <div className="relative">
                          <select 
                            id="disponibilidad-candidato-2"
                            value={form.availability} 
                            onChange={(e) => setForm({...form, availability: e.target.value})}
                            className="w-full h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                            aria-label="Selecciona tu disponibilidad"
                          >
                            <option value="">Selecciona tu disponibilidad</option>
                            <option value="fulltime">Tiempo completo</option>
                            <option value="parttime">Medio tiempo</option>
                            <option value="freelance">Freelance</option>
                            <option value="internship">Prácticas</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Salario esperado (USD/año)</label>
                        <Input 
                          type="number"
                          placeholder="Ej: 50000"
                          value={form.expectedSalary} 
                          onChange={(e) => setForm({...form, expectedSalary: e.target.value})}
                          className="h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="modalidad" className="text-sm font-medium text-[#1D1D1F]">Modalidad preferida</label>
                        <div className="relative">
                          <select 
                            id="modalidad"
                            value={form.modalityPref} 
                            onChange={(e) => setForm({...form, modalityPref: e.target.value})}
                            className="w-full h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                            aria-label="Selecciona modalidad de trabajo"
                          >
                            <option value="">Selecciona modalidad</option>
                            <option value="remote">Remoto</option>
                            <option value="hybrid">Híbrido</option>
                            <option value="onsite">Presencial</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* EMPRESA */}
                  {role === "empresa" && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="industria-empresa" className="text-sm font-medium text-[#1D1D1F]">Industria</label>
                        <div className="relative">
                          <select 
                            id="industria-empresa"
                            value={form.industry} 
                            onChange={(e) => setForm({...form, industry: e.target.value})}
                            className="w-full h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                            aria-label="Selecciona industria"
                          >
                            <option value="">Selecciona industria</option>
                            <option value="tech">Tecnología</option>
                            <option value="fintech">Fintech</option>
                            <option value="health">Salud</option>
                            <option value="ecommerce">E-commerce</option>
                            <option value="education">Educación</option>
                            <option value="marketing">Marketing</option>
                            <option value="consulting">Consultoría</option>
                            <option value="other">Otra</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="tamaño-empresa" className="text-sm font-medium text-[#1D1D1F]">Tamaño de la empresa</label>
                        <div className="relative">
                          <select 
                            id="tamaño-empresa"
                            value={form.companySize} 
                            onChange={(e) => setForm({...form, companySize: e.target.value})}
                            className="w-full h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                            aria-label="Selecciona tamaño de empresa"
                          >
                            <option value="">Selecciona tamaño</option>
                            <option value="startup">Startup (1-10)</option>
                            <option value="small">Pequeña (11-50)</option>
                            <option value="medium">Mediana (51-200)</option>
                            <option value="large">Grande (201-1000)</option>
                            <option value="enterprise">Enterprise (1000+)</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* FREELANCER */}
                  {role === "freelancer" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Tarifa por hora (USD)</label>
                        <Input 
                          type="number"
                          min="1"
                          placeholder="Ej: 50"
                          value={form.hourlyRate} 
                          onChange={(e) => setForm({...form, hourlyRate: e.target.value})}
                          className="h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="disponibilidad-freelancer" className="text-sm font-medium text-[#1D1D1F]">Disponibilidad</label>
                        <div className="relative">
                          <select 
                            id="disponibilidad-freelancer"
                            value={form.availability} 
                            onChange={(e) => setForm({...form, availability: e.target.value})}
                            className="w-full h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                            aria-label="Selecciona disponibilidad de trabajo"
                          >
                            <option value="">Selecciona disponibilidad</option>
                            <option value="fulltime">Tiempo completo</option>
                            <option value="parttime">Medio tiempo</option>
                            <option value="projects">Por proyectos</option>
                            <option value="weekends">Fines de semana</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* EMPRENDEDOR */}
                  {role === "emprendedor" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Bio / Sobre ti</label>
                        <textarea 
                          placeholder="Describe tu experiencia y lo que buscas..."
                          value={form.bio} 
                          onChange={(e) => setForm({...form, bio: e.target.value})}
                          className="w-full h-24 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] p-4 placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="industria-emprendedor" className="text-sm font-medium text-[#1D1D1F]">Industria de interés</label>
                        <div className="relative">
                          <select 
                            id="industria-emprendedor"
                            value={form.industry} 
                            onChange={(e) => setForm({...form, industry: e.target.value})}
                            className="w-full h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                            aria-label="Selecciona industria de interés"
                          >
                            <option value="">Selecciona industria</option>
                            <option value="tech">Tecnología</option>
                            <option value="fintech">Fintech</option>
                            <option value="health">Salud</option>
                            <option value="ecommerce">E-commerce</option>
                            <option value="education">Educación</option>
                            <option value="sustainability">Sostenibilidad</option>
                            <option value="other">Otra</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Nombre del proyecto (opcional)</label>
                        <Input 
                          placeholder="Ej: Mi Startup"
                          value={form.projectName} 
                          onChange={(e) => setForm({...form, projectName: e.target.value})}
                          className="h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                        />
                      </div>
                    </>
                  )}

                  {/* ESTUDIANTE */}
                  {role === "estudiante" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Institución educativa</label>
                        <Input 
                          placeholder="Ej: Universidad Nacional"
                          value={form.institution} 
                          onChange={(e) => setForm({...form, institution: e.target.value})}
                          className="h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Carrera</label>
                        <Input 
                          placeholder="Ej: Ingeniería de Software"
                          value={form.career} 
                          onChange={(e) => setForm({...form, career: e.target.value})}
                          className="h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Semestre</label>
                        <Input 
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Ej: 5"
                          value={form.semester} 
                          onChange={(e) => setForm({...form, semester: e.target.value})}
                          className="h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="tipo-practica" className="text-sm font-medium text-[#1D1D1F]">Tipo de práctica</label>
                        <div className="relative">
                          <select 
                            id="tipo-practica"
                            value={form.availability} 
                            onChange={(e) => setForm({...form, availability: e.target.value})}
                            className="w-full h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] px-4 appearance-none focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                            aria-label="Selecciona tipo de práctica"
                          >
                            <option value="">Selecciona tipo</option>
                            <option value="professional">Práctica profesional</option>
                            <option value="internship">Pasantía</option>
                            <option value="project">Proyecto de grado</option>
                            <option value="volunteer">Voluntariado</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B] pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Horas semanales disponibles</label>
                        <Input 
                          type="number"
                          min="1"
                          max="40"
                          placeholder="Ej: 20"
                          value={form.weeklyHours} 
                          onChange={(e) => setForm({...form, weeklyHours: e.target.value})}
                          className="h-12 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-4 mt-8">
                  <Button 
                    onClick={() => setStep("account")} 
                    variant="outline" 
                    className="flex-1 h-14 border-[#D2D2D7] rounded-xl font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7]"
                  >
                    Atrás
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="flex-1 h-14 bg-[#1D1D1F] hover:bg-[#333] text-white rounded-xl font-semibold"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Crear cuenta</>}
                  </Button>
                </div>
              </>
            )}

            {step === "verify" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#FFD93D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1D1D1F] mb-2">Verifica tu email</h3>
                  <p className="text-sm text-[#86868B]">
                    Enviamos un código de 6 dígitos a <strong>{form.email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1D1D1F]">Código de verificación</label>
                    <Input 
                      type="text" 
                      maxLength={6}
                      placeholder="123456" 
                      value={verificationCode} 
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))} 
                      className="h-14 bg-[#F5F5F7] border-0 rounded-xl text-[#1D1D1F] text-center text-2xl tracking-widest placeholder:text-[#86868B] focus:ring-2 focus:ring-[#FFD93D] focus:bg-white transition-all" 
                    />
                  </div>

                  <Button 
                    onClick={handleVerifyCode} 
                    disabled={loading || verificationCode.length !== 6} 
                    className="w-full h-14 bg-[#1D1D1F] hover:bg-[#333] text-white rounded-xl font-semibold"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verificar y continuar</>}
                  </Button>

                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-sm text-[#86868B]">
                        Reenviar código en {resendTimer}s
                      </p>
                    ) : (
                      <button 
                        onClick={handleResendCode}
                        disabled={loading}
                        className="text-sm text-[#0071E3] hover:underline font-medium"
                      >
                        Reenviar código
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Footer note - solo en account y profile */}
            {step !== "verify" && (
              <div className="mt-8 bg-[#FFF9E6] rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#F5A623]">🕐</span>
                  <p className="text-sm text-[#1D1D1F]">
                    Puedes cambiar de rol más tarde desde tu perfil.
                  </p>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-[#86868B]">
              ¿Necesitas ayuda? <Link to="/contacto" className="text-[#F5A623] hover:underline">Contáctanos</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterClean;
