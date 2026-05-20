// Datos mock con sabor LATAM para Joblify
export type UserRole = "candidato" | "freelancer" | "empresa" | "emprendedor" | "estudiante";

export const userTypes: { id: UserRole; title: string; description: string; perks: string[] }[] = [
  {
    id: "candidato",
    title: "Candidato",
    description: "Encuentra tu próximo empleo con match inteligente.",
    perks: ["CV con IA", "Match score", "Alertas en tiempo real"],
  },
  {
    id: "freelancer",
    title: "Freelancer",
    description: "Vende tus servicios y construye tu reputación.",
    perks: ["Portafolio público", "Pagos protegidos", "Reseñas verificadas"],
  },
  {
    id: "empresa",
    title: "Empresa",
    description: "Publica vacantes y contrata más rápido con IA.",
    perks: ["Pipeline visual", "Ranking de talento", "ATS integrado"],
  },
  {
    id: "emprendedor",
    title: "Emprendedor",
    description: "Arma tu equipo fundador y encuentra cofundadores.",
    perks: ["Red de founders", "Equity matching", "Comunidad activa"],
  },
  {
    id: "estudiante",
    title: "Estudiante",
    description: "Prácticas, becas y mentorías para tu carrera.",
    perks: ["Mentores", "Pasantías", "Workshops gratis"],
  },
];

export const stats = [
  { value: "120K+", label: "Profesionales LATAM" },
  { value: "8.4K", label: "Empresas activas" },
  { value: "32K", label: "Vacantes este mes" },
  { value: "94%", label: "Match precision" },
];

export type Job = {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  modality: "Remoto" | "Híbrido" | "Presencial";
  type: "Full-time" | "Part-time" | "Freelance" | "Pasantía";
  salary: string;
  postedAt: string;
  skills: string[];
  description: string;
  match?: number;
  featured?: boolean;
};

export const jobs: Job[] = [
  {
    id: "1",
    title: "Senior Product Designer",
    company: "Rappi",
    companyLogo: "R",
    location: "Bogotá, Colombia",
    modality: "Híbrido",
    type: "Full-time",
    salary: "USD 4.5K – 6K",
    postedAt: "Hace 2 días",
    skills: ["Figma", "Design Systems", "Research"],
    description:
      "Lideramos la próxima evolución del producto de delivery. Buscamos un diseñador con visión sistémica y obsesión por el detalle.",
    match: 96,
    featured: true,
  },
  {
    id: "2",
    title: "Backend Engineer (Go)",
    company: "Mercado Libre",
    companyLogo: "M",
    location: "Buenos Aires, Argentina",
    modality: "Remoto",
    type: "Full-time",
    salary: "USD 5K – 7.5K",
    postedAt: "Hace 1 día",
    skills: ["Go", "Kafka", "PostgreSQL"],
    description: "Construimos infraestructura para 100M+ usuarios. Equipo distribuido, fuerte cultura de ownership.",
    match: 91,
    featured: true,
  },
  {
    id: "3",
    title: "Growth Marketing Lead",
    company: "Nubank",
    companyLogo: "N",
    location: "Ciudad de México",
    modality: "Híbrido",
    type: "Full-time",
    salary: "MXN 90K – 130K",
    postedAt: "Hace 3 días",
    skills: ["Performance", "Analytics", "CRM"],
    description: "Escalamos la adquisición de tarjetahabientes en México. Buscamos data-driven con sensibilidad creativa.",
    match: 88,
  },
  {
    id: "4",
    title: "Data Scientist",
    company: "Globant",
    companyLogo: "G",
    location: "Remoto",
    modality: "Remoto",
    type: "Full-time",
    salary: "USD 4K – 6K",
    postedAt: "Hace 5 días",
    skills: ["Python", "ML", "SQL"],
    description: "Modelos de recomendación a escala para clientes Fortune 500.",
    match: 84,
  },
  {
    id: "5",
    title: "iOS Engineer",
    company: "Kavak",
    companyLogo: "K",
    location: "Ciudad de México",
    modality: "Presencial",
    type: "Full-time",
    salary: "MXN 80K – 110K",
    postedAt: "Hace 1 semana",
    skills: ["Swift", "SwiftUI", "Combine"],
    description: "Reimaginamos la compra-venta de autos en LATAM.",
    match: 79,
  },
  {
    id: "6",
    title: "UX Researcher (Freelance)",
    company: "Platzi",
    companyLogo: "P",
    location: "Remoto",
    modality: "Remoto",
    type: "Freelance",
    salary: "USD 60 / hora",
    postedAt: "Hoy",
    skills: ["Entrevistas", "Usabilidad", "Notion"],
    description: "Proyecto de 3 meses para redefinir el flujo de onboarding educativo.",
    match: 92,
    featured: true,
  },
];

export const trendingTags = [
  "React", "Product Design", "AI/ML", "Growth", "Backend", "Data", "Mobile", "DevOps",
  "Marketing", "Sales", "Finanzas", "Diseño UX", "Cybersecurity", "Blockchain",
];

export const benefits = [
  {
    title: "Match con IA",
    description: "Algoritmo que entiende tu perfil y te conecta con oportunidades alineadas — no listados infinitos.",
  },
  {
    title: "Reputación verificada",
    description: "Reseñas, portafolio y validación de skills. Tu reputación viaja contigo.",
  },
  {
    title: "Un solo ecosistema",
    description: "Empleos, freelance, mentorías, equipos fundadores. Toda tu vida profesional en un lugar.",
  },
];

export const testimonials = [
  {
    name: "Camila Restrepo",
    role: "Product Designer · Bogotá",
    text: "Encontré mi rol actual en menos de dos semanas. El match score realmente filtra ruido.",
  },
  {
    name: "Diego Fernández",
    role: "Founder · Buenos Aires",
    text: "Armé mi equipo fundador desde Joblify. La red de founders de LATAM es única.",
  },
  {
    name: "María José Soto",
    role: "Talent Lead · CDMX",
    text: "Reducimos el time-to-hire 40%. El pipeline visual es exactamente lo que necesitábamos.",
  },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "USD 0",
    period: "siempre",
    description: "Para explorar y crear tu perfil profesional.",
    features: ["Perfil público", "5 postulaciones / mes", "Match básico", "Comunidad"],
    cta: "Empezar gratis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "USD 12",
    period: "/ mes",
    description: "Para profesionales que buscan activamente.",
    features: [
      "Postulaciones ilimitadas",
      "Match con IA premium",
      "Boost de visibilidad",
      "Insights de mercado",
      "Mentorías 1:1",
    ],
    cta: "Probar 14 días gratis",
    highlight: true,
  },
  {
    name: "Empresas",
    price: "USD 199",
    period: "/ mes",
    description: "Para equipos que contratan a escala.",
    features: ["Vacantes ilimitadas", "ATS + Pipeline", "Ranking IA", "API & integraciones", "Soporte dedicado"],
    cta: "Hablar con ventas",
    highlight: false,
  },
];

export type Candidate = {
  id: string;
  name: string;
  title: string;
  location: string;
  avatar: string;
  match: number;
  skills: string[];
  experience: string;
  stage?: "Nuevo" | "Screening" | "Entrevista" | "Oferta" | "Contratado";
};

export const candidates: Candidate[] = [
  { id: "c1", name: "Lucía Méndez", title: "Senior Product Designer", location: "Medellín", avatar: "LM", match: 96, skills: ["Figma", "DS", "Research"], experience: "7 años", stage: "Entrevista" },
  { id: "c2", name: "Andrés Vega", title: "Product Designer", location: "Lima", avatar: "AV", match: 92, skills: ["Figma", "Prototyping"], experience: "5 años", stage: "Screening" },
  { id: "c3", name: "Sofía Carvalho", title: "UX Lead", location: "São Paulo", avatar: "SC", match: 89, skills: ["Strategy", "DS"], experience: "9 años", stage: "Nuevo" },
  { id: "c4", name: "Mateo Rojas", title: "Product Designer", location: "Santiago", avatar: "MR", match: 87, skills: ["Figma", "Motion"], experience: "4 años", stage: "Oferta" },
  { id: "c5", name: "Valentina Pino", title: "Senior Designer", location: "Buenos Aires", avatar: "VP", match: 85, skills: ["DS", "Branding"], experience: "6 años", stage: "Nuevo" },
  { id: "c6", name: "Joaquín Silva", title: "Product Designer", location: "Quito", avatar: "JS", match: 82, skills: ["Figma", "User Testing"], experience: "3 años", stage: "Screening" },
];

export type FreelanceService = {
  id: string;
  title: string;
  category: string;
  price: string;
  delivery: string;
  rating: number;
  reviews: number;
};

export const freelanceServices: FreelanceService[] = [
  { id: "s1", title: "Diseño de landing page premium", category: "Diseño Web", price: "USD 450", delivery: "5 días", rating: 4.9, reviews: 128 },
  { id: "s2", title: "Identidad visual completa", category: "Branding", price: "USD 1,200", delivery: "14 días", rating: 5.0, reviews: 64 },
  { id: "s3", title: "Auditoría UX express", category: "Research", price: "USD 280", delivery: "3 días", rating: 4.8, reviews: 91 },
];

export type ChatMessage = { id: string; from: "me" | "them"; text: string; time: string };
export type Conversation = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
};

export const conversations: Conversation[] = [
  {
    id: "conv1",
    name: "Lucía Méndez",
    avatar: "LM",
    role: "Talent · Rappi",
    lastMessage: "Perfecto, te confirmo el horario.",
    time: "14:32",
    unread: 2,
    messages: [
      { id: "m1", from: "them", text: "Hola, vi tu perfil y me encantaría agendar una llamada.", time: "14:20" },
      { id: "m2", from: "me", text: "¡Hola Lucía! Claro, esta semana tengo disponibilidad.", time: "14:22" },
      { id: "m3", from: "them", text: "¿Te parece el jueves a las 11?", time: "14:30" },
      { id: "m4", from: "me", text: "Me funciona perfecto.", time: "14:31" },
      { id: "m5", from: "them", text: "Perfecto, te confirmo el horario.", time: "14:32" },
    ],
  },
  {
    id: "conv2",
    name: "Andrés Vega",
    avatar: "AV",
    role: "Founder · Stealth",
    lastMessage: "Te paso el deck por aquí.",
    time: "Ayer",
    unread: 0,
    messages: [
      { id: "m1", from: "them", text: "¡Hola! Estoy armando equipo fundador.", time: "10:00" },
      { id: "m2", from: "me", text: "Cuéntame más, me interesa.", time: "10:05" },
      { id: "m3", from: "them", text: "Te paso el deck por aquí.", time: "10:10" },
    ],
  },
  {
    id: "conv3",
    name: "Sofía Carvalho",
    avatar: "SC",
    role: "Recruiter · Nubank",
    lastMessage: "Quedamos en contacto.",
    time: "Lun",
    unread: 0,
    messages: [
      { id: "m1", from: "them", text: "Gracias por tu tiempo hoy.", time: "16:00" },
      { id: "m2", from: "me", text: "Igualmente, me encantó la conversación.", time: "16:05" },
      { id: "m3", from: "them", text: "Quedamos en contacto.", time: "16:10" },
    ],
  },
];

export const featuredCompanies = [
  { name: "Rappi", logo: "R" },
  { name: "Mercado Libre", logo: "M" },
  { name: "Nubank", logo: "N" },
  { name: "Globant", logo: "G" },
  { name: "Kavak", logo: "K" },
  { name: "Platzi", logo: "P" },
  { name: "Cornershop", logo: "C" },
  { name: "Despegar", logo: "D" },
];

export const categories = [
  { name: "Diseño", count: 235, icon: "Palette" },
  { name: "Ventas", count: 758, icon: "TrendingUp" },
  { name: "Marketing", count: 140, icon: "Megaphone" },
  { name: "Finanzas", count: 325, icon: "Banknote" },
  { name: "Tecnólogos", count: 436, icon: "Monitor" },
  { name: "Ingeniería", count: 542, icon: "Code2" },
  { name: "Administración", count: 211, icon: "Briefcase" },
  { name: "Recursos Humanos", count: 348, icon: "Users" },
];

export const trustedCompanies = [
  "Vodafone", "Intel", "TESLA", "AMD", "Talkit",
];
