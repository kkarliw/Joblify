import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, User, Building2, Zap, Rocket, GraduationCap } from "lucide-react";
import { Logo } from "@/components/Logo";
import { type UserRole } from "@/store/authStore";

type Mode = "login" | "register";

// Iconos SVG únicos para cada rol
const RoleIcons: Record<UserRole, React.ReactNode> = {
  candidato: (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
      <circle cx="20" cy="14" r="8" stroke="#1D1D1F" strokeWidth="2.5" fill="none"/>
      <path d="M8 34 C8 26 14 22 20 22 C26 22 32 26 32 34" stroke="#1D1D1F" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="20" cy="14" r="3" fill="#1D1D1F"/>
    </svg>
  ),
  empresa: (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
      <rect x="8" y="12" width="24" height="20" rx="2" stroke="#1D1D1F" strokeWidth="2.5"/>
      <rect x="12" y="22" width="6" height="6" rx="1" fill="#1D1D1F"/>
      <rect x="22" y="22" width="6" height="6" rx="1" fill="#1D1D1F"/>
      <path d="M16 12V8h8v4" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  freelancer: (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
      <path d="M12 20 L20 12 L28 20 L20 28 Z" stroke="#1D1D1F" strokeWidth="2.5" strokeLinejoin="round"/>
      <circle cx="20" cy="20" r="4" fill="#1D1D1F"/>
      <path d="M8 32 L12 28 M32 32 L28 28" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  emprendedor: (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
      <path d="M20 8 L24 16 L32 16 L26 22 L28 30 L20 25 L12 30 L14 22 L8 16 L16 16 Z" stroke="#1D1D1F" strokeWidth="2" strokeLinejoin="round" fill="#1D1D1F"/>
      <path d="M20 8 L20 4" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 30 C28 34 24 36 20 36 C16 36 12 34 12 30" stroke="#1D1D1F" strokeWidth="2" fill="none"/>
    </svg>
  ),
  estudiante: (
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
      <path d="M20 8 L32 14 L20 20 L8 14 Z" stroke="#1D1D1F" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M8 14 V24 M32 14 V24" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 20 V28 C12 30 16 32 20 32 C24 32 28 30 28 28 V20" stroke="#1D1D1F" strokeWidth="2.5" fill="none"/>
      <circle cx="20" cy="26" r="2" fill="#1D1D1F"/>
    </svg>
  ),
};

const roles: { id: UserRole; title: string; subtitle: string }[] = [
  { id: "candidato", title: "Talento", subtitle: "Busco empleo o proyectos que impulsen mi carrera." },
  { id: "empresa", title: "Empresa", subtitle: "Quiero contratar talento y gestionar mi equipo." },
  { id: "freelancer", title: "Freelancer", subtitle: "Ofrezco servicios y proyectos independientes." },
  { id: "emprendedor", title: "Emprendedor", subtitle: "Estoy construyendo mi startup o idea de negocio." },
  { id: "estudiante", title: "Estudiante", subtitle: "Busco prácticas, mentoría y aprender." },
];

const getRoleUrl = (mode: Mode, role: UserRole) => {
  if (mode === "login") return `/login?role=${role}`;
  return `/register?role=${role}`;
};

const RoleSelect = ({ mode }: { mode: Mode }) => {
  const copy =
    mode === "login"
      ? { h1: "Entra a Joblify", sub: "Selecciona tu rol para continuar." }
      : { h1: "Crea tu cuenta", sub: "Elige el rol que mejor te representa para comenzar." };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[#D2D2D7] flex items-center justify-between px-6 lg:px-12">
        <Logo size="lg" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#86868B]">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
          </span>
          <Link
            to={mode === "login" ? "/register/elegir" : "/login/elegir"}
            className="px-5 py-2 text-sm font-medium text-[#1D1D1F] border border-[#D2D2D7] rounded-full hover:bg-[#F5F5F7] transition-colors"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
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

        {/* Right - Role Selection */}
        <div className="flex flex-col justify-center px-6 lg:px-12 py-8">
          <div className="max-w-md mx-auto w-full">
            {/* Back button and step indicator */}
            <div className="flex items-center justify-between mb-8">
              <Link
                to="/"
                className="flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Volver</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFD93D]"></div>
                <span className="text-sm font-medium text-[#F5A623]">
                  PASO 1 DE 2
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="mb-8">
              <p className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider mb-2">
                {mode === "login" ? "Login" : "Registro"}
              </p>
              <h2 className="text-3xl font-bold text-[#1D1D1F]">
                {copy.h1}
              </h2>
              <p className="text-[#86868B] mt-2">
                {copy.sub}
              </p>
            </div>

            {/* Roles list */}
            <div className="space-y-3">
              {roles.map((r) => (
                <Link
                  key={r.id}
                  to={getRoleUrl(mode, r.id)}
                  className="group flex items-center gap-4 rounded-2xl border border-[#D2D2D7] bg-white p-4 transition-all hover:border-[#FFD93D] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#FFD93D] to-[#F5A623] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    {RoleIcons[r.id]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1D1D1F] text-lg">Soy {r.title}</h3>
                      {r.id === "candidato" && (
                        <span className="px-2 py-0.5 bg-[#FFD93D]/20 text-[#F5A623] text-xs font-medium rounded-full">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#86868B]">{r.subtitle}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#86868B] group-hover:text-[#F5A623] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>

            {/* Footer note */}
            <div className="mt-8 bg-[#FFF9E6] rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[#1D1D1F]">
                  Puedes cambiar de rol más tarde desde tu perfil.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-[#86868B]">
              ¿Necesitas ayuda? <Link to="/contacto" className="text-[#F5A623] hover:underline">Contáctanos</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelect;
