import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight, Search, Palette, TrendingUp, Megaphone, Banknote,
  Monitor, Code2, Briefcase, Users, Star, FileText, UserCheck, ShieldCheck,
  Sparkles, CheckCircle2, Quote,
} from "lucide-react";
import { PublicLayout } from "@/components/Layouts";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/Brand";
import { LogoMarquee } from "@/components/LogoMarquee";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { feedApi, jobsApi, userApi } from "@/lib/api";

type LandingJobApiItem = {
  id: string;
  title: string;
  location?: string;
  modality?: string;
  type?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  poster?: { name?: string };
  skills?: Array<{ skill?: { name?: string } }>;
  category?: { name?: string };
};

type LandingJobCard = {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  modality: string;
  type: string;
  salary: string;
  skills: string[];
};

type LandingCategory = {
  name: string;
  count: number;
  icon: keyof typeof iconMap;
};

type FreelancerUserItem = {
  id: string;
  name: string;
  headline?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  profileCompletion?: number | null;
};

type CommunityPost = {
  id: string;
  content: string;
  author?: {
    name?: string;
    headline?: string;
  };
};

const FALLBACK_TESTIMONIAL = {
  text: "Joblify centraliza oportunidades reales para talento y empresas en un solo ecosistema profesional.",
  name: "Comunidad Joblify",
  role: "Ecosistema LATAM",
};

const normalizeModality = (value?: string) => {
  if (!value) return "Flexible";
  if (value === "REMOTO") return "Remoto";
  if (value === "HIBRIDO") return "Híbrido";
  if (value === "PRESENCIAL") return "Presencial";
  return value;
};

const normalizeType = (value?: string) => {
  if (!value) return "Tiempo completo";
  if (value === "FULL_TIME") return "Full-time";
  if (value === "PART_TIME") return "Part-time";
  if (value === "FREELANCE") return "Freelance";
  if (value === "PASANTIA") return "Pasantía";
  return value;
};

const formatSalary = (job: LandingJobApiItem) => {
  if (typeof job.salaryMin === "number" && typeof job.salaryMax === "number") {
    return `${job.salaryCurrency || "USD"} ${job.salaryMin} – ${job.salaryMax}`;
  }
  return "Salario a convenir";
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette, TrendingUp, Megaphone, Banknote, Monitor, Code2, Briefcase, Users,
};

const revealEase = [0.22, 1, 0.36, 1] as const;

const Landing = () => {
  const { data: jobsData = [] } = useQuery<LandingJobApiItem[]>({
    queryKey: ["landing", "jobs"],
    queryFn: async () => {
      const { data } = await jobsApi.list({ limit: 16 });
      if (Array.isArray(data)) return data as LandingJobApiItem[];
      if (data && typeof data === "object" && Array.isArray((data as { jobs?: unknown }).jobs)) {
        return (data as { jobs: LandingJobApiItem[] }).jobs;
      }
      return [];
    },
  });

  const { data: freelancersData = [] } = useQuery<FreelancerUserItem[]>({
    queryKey: ["landing", "freelancers"],
    queryFn: async () => {
      const { data } = await userApi.searchPublic("", "freelancer", 1, 6);
      if (Array.isArray(data)) return data as FreelancerUserItem[];
      if (data && typeof data === "object") {
        if (Array.isArray((data as { users?: unknown }).users)) return (data as { users: FreelancerUserItem[] }).users;
        if (Array.isArray((data as { data?: unknown }).data)) return (data as { data: FreelancerUserItem[] }).data;
      }
      return [];
    },
  });

  const { data: communityPosts = [] } = useQuery<CommunityPost[]>({
    queryKey: ["landing", "community"],
    queryFn: async () => {
      const { data } = await feedApi.publicPosts(1);
      if (Array.isArray(data)) return data as CommunityPost[];
      if (data && typeof data === "object" && Array.isArray((data as { posts?: unknown }).posts)) {
        return (data as { posts: CommunityPost[] }).posts;
      }
      return [];
    },
  });

  const jobs = useMemo<LandingJobCard[]>(
    () =>
      jobsData.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.poster?.name || "Empresa",
        companyLogo: (job.poster?.name || "E").slice(0, 1).toUpperCase(),
        location: job.location || "Remoto",
        modality: normalizeModality(job.modality),
        type: normalizeType(job.type),
        salary: formatSalary(job),
        skills: Array.isArray(job.skills)
          ? job.skills.map((entry) => entry.skill?.name).filter((name): name is string => Boolean(name))
          : [],
      })),
    [jobsData]
  );

  const categories = useMemo<LandingCategory[]>(() => {
    const iconKeys = Object.keys(iconMap) as Array<keyof typeof iconMap>;
    const counts = new Map<string, number>();

    jobsData.forEach((job) => {
      const key = job.category?.name || normalizeType(job.type);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const entries = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (entries.length === 0) {
      return [
        { name: "Diseño", count: 0, icon: "Palette" },
        { name: "Tecnología", count: 0, icon: "Code2" },
        { name: "Marketing", count: 0, icon: "Megaphone" },
        { name: "Operaciones", count: 0, icon: "Briefcase" },
      ];
    }

    return entries.map(([name, count], index) => ({
      name,
      count,
      icon: iconKeys[index % iconKeys.length],
    }));
  }, [jobsData]);

  const matchJobs = jobs.slice(0, 8);
  const featuredFreelancers = freelancersData.slice(0, 6);

  const highlightedTestimonial = useMemo(() => {
    const post = communityPosts[0];
    if (!post) return FALLBACK_TESTIMONIAL;

    return {
      text: post.content,
      name: post.author?.name || FALLBACK_TESTIMONIAL.name,
      role: post.author?.headline || FALLBACK_TESTIMONIAL.role,
    };
  }, [communityPosts]);

  const reduceMotion = useReducedMotion();

  const heroReveal = (delay = 0) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.52, delay, ease: revealEase },
  });

  const sectionReveal = (delay = 0) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.52, delay, ease: revealEase },
  });

  const staggerGrid = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: 0.04,
      },
    },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.46, ease: revealEase },
    },
  };

  const mockFloatAnimation = reduceMotion ? undefined : { y: [0, -8, 0] };
  const mockFloatTransition = reduceMotion
    ? undefined
    : { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.9 };

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-white">
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-28 -top-36 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -left-6 -top-16 h-[340px] w-[420px] rounded-full bg-primary/6 blur-[100px]" />
          <div className="absolute left-[16%] top-0 h-[220px] w-[300px] rounded-full bg-white/85 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 sm:pt-12 lg:pt-14 pb-10 sm:pb-12 lg:pb-14">

          <div className="grid items-center gap-10 lg:gap-14 lg:grid-cols-[1.03fr_0.97fr]">
            <div className="order-1 max-w-[760px]">
              <motion.h1
                {...heroReveal(0.08)}
                className="font-fustat font-bold text-primary leading-[1.05] tracking-[-0.04em] text-[2.35rem] sm:text-[3.1rem] md:text-[3.9rem] lg:text-[4.4rem] xl:text-[4.8rem] 2xl:text-[75px]"
              >
                Conecta talento,
                <br />
                crece más rápido
              </motion.h1>

              <motion.p
                {...heroReveal(0.16)}
                className="font-inter mt-5 text-[16px] sm:text-[18px] tracking-[-0.02em] text-muted-foreground leading-relaxed max-w-[640px]"
              >
                Joblify reúne vacantes, freelancers, comunidad y empresas en un solo ecosistema. Nuestro matching con IA
                te ayuda a encontrar mejores oportunidades y mejores candidatos en menos tiempo.
              </motion.p>

              <motion.div {...heroReveal(0.24)} className="mt-8 flex items-center">
                <Link
                  to="/register"
                  className="font-inter group inline-flex items-center gap-3 rounded-[16px] bg-primary px-6 py-3 text-sm sm:text-base font-semibold text-white backdrop-blur-[2px] shadow-[inset_0_4px_4px_0_rgba(255,255,255,0.35),0_16px_38px_-22px_rgba(0,0,0,0.45)] transition-all duration-300 hover:scale-[1.02] hover:bg-primary-hover"
                >
                  Crear cuenta gratis
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-foreground transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            </div>

            <motion.div {...heroReveal(0.32)} className="order-2 relative w-full mt-3 sm:mt-4 lg:mt-6">
              <div className="relative mx-auto h-[330px] sm:h-[430px] lg:h-[540px] xl:h-[600px] w-full max-w-[760px] flex items-center justify-center">
                <motion.img
                  animate={mockFloatAnimation}
                  transition={mockFloatTransition}
                  src="/hero-mock.png"
                  alt="Vista de la app de Joblify"
                  className="w-[79%] sm:w-[75%] lg:w-[86%] max-w-[620px] h-auto object-contain drop-shadow-[0_30px_60px_-28px_rgba(0,0,0,0.35)]"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>

          <motion.div {...sectionReveal()} className="mt-14 border-t border-border/70 pt-8 sm:pt-10">
            <p className="font-inter text-xs sm:text-sm text-muted-foreground tracking-wide text-center lg:text-left">
              Empresas top que ya confían en Joblify
            </p>
            <div className="mt-6">
              <LogoMarquee variant="light" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS — 3 pasos */}
      <section className="py-14 md:py-20 bg-surface-elevated/40">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
          <motion.div {...sectionReveal()} className="text-center mb-10 md:mb-14">
            <span className="inline-block text-[10px] sm:text-[11px] font-subtitle font-semibold tracking-[0.2em] text-primary uppercase mb-3 sm:mb-4">
              Cómo funciona
            </span>
            <h2 className="font-fustat text-[1.75rem] leading-[1.15] sm:text-4xl md:text-5xl font-bold tracking-tight">
              Conseguir trabajo nunca <br className="hidden md:block" />fue tan <span className="text-primary">simple</span>
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground font-sans max-w-xl mx-auto">
              Tres pasos para que tu próxima oportunidad te encuentre a ti.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerGrid}
            className="grid md:grid-cols-3 gap-4 md:gap-5"
          >
            {[
              { icon: FileText, title: "Crea tu perfil", desc: "Sube tu CV o conéctalo con LinkedIn. Nuestra IA destaca tus fortalezas en segundos." },
              { icon: UserCheck, title: "Recibe tu match", desc: "Te conectamos con vacantes y empresas que realmente coinciden con tu perfil y aspiraciones." },
              { icon: ShieldCheck, title: "Aplica con confianza", desc: "Procesos verificados, contratos claros y pagos protegidos para freelancers." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                variants={staggerItem}
                className={cn(
                  "group bg-white border border-border rounded-2xl p-6 md:p-8 text-center transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(37,50,75,0.18)]"
                )}
              >
                <div className="mx-auto h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-4 md:mb-5 group-hover:bg-primary transition-colors">
                  <step.icon className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
                </div>
                <h3 className="font-subtitle font-semibold text-base md:text-lg text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">{step.desc}</p>
                <Link to="/register" className="inline-flex items-center gap-1.5 mt-4 md:mt-5 text-xs font-subtitle font-semibold text-foreground hover:gap-2 transition-all">
                  Empezar ahora <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section id="vacantes" className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div {...sectionReveal()} className="flex items-end justify-between gap-4 mb-12">
            <h2 className="font-fustat text-3xl md:text-5xl font-bold tracking-tight">
              Explora por <span className="text-primary">categoría</span>
            </h2>
            <Link to="/vacantes" className="hidden md:inline-flex items-center gap-1.5 text-sm font-subtitle font-semibold text-foreground hover:gap-2 transition-all">
              Ver todas las vacantes <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerGrid}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {categories.map((cat, i) => {
              const Icon = iconMap[cat.icon];
              const isHighlighted = i === 2;
              return (
                <motion.div key={cat.name} variants={staggerItem}>
                  <Link
                    to="/vacantes"
                    className={cn(
                      "group p-6 rounded-xl border transition-all hover:-translate-y-0.5 block",
                      isHighlighted
                        ? "bg-primary border-primary text-foreground"
                        : "bg-white border-border hover:border-foreground"
                    )}
                  >
                    {Icon && <Icon className={cn("h-7 w-7 mb-5", isHighlighted ? "text-foreground" : "text-primary")} />}
                    <h3 className="font-subtitle font-semibold text-base mb-1.5">{cat.name}</h3>
                    <div className="flex items-center justify-between text-xs font-sans text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>{cat.count} Trabajos disponibles</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FREELANCERS */}
      <section id="freelancers" className="py-20 bg-surface-elevated/40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div {...sectionReveal()} className="flex items-end justify-between gap-4 mb-10">
            <div>
              <span className="inline-block text-[11px] font-subtitle font-semibold tracking-[0.2em] text-primary uppercase mb-3">
                Talento independiente
              </span>
              <h2 className="font-fustat text-3xl md:text-5xl font-bold tracking-tight">
                Freelancers verificados para <span className="text-primary">proyectos reales</span>
              </h2>
              <p className="mt-4 text-sm md:text-base text-muted-foreground font-sans max-w-2xl">
                Encuentra especialistas en diseño, producto y tecnología con ratings visibles, tiempos de entrega claros y contacto directo.
              </p>
            </div>
            <Link to="/freelancers" className="hidden md:inline-flex items-center gap-1.5 text-sm font-subtitle font-semibold text-foreground hover:gap-2 transition-all">
              Ver freelancers <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerGrid}
            className="grid md:grid-cols-3 gap-4"
          >
            {featuredFreelancers.map((freelancer) => (
              <motion.article
                key={freelancer.id}
                variants={staggerItem}
                className="rounded-2xl border border-border bg-white p-5 hover:border-foreground hover:shadow-[0_12px_28px_-16px_rgba(37,50,75,0.2)] transition-all"
              >
                <p className="text-[10px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">Freelancer verificado</p>
                <h3 className="mt-2 text-base font-subtitle font-semibold text-foreground leading-snug">{freelancer.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 font-sans">{freelancer.headline || "Especialista independiente"}</p>
                <div className="mt-4 flex items-center justify-between text-xs font-sans text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> Perfil {freelancer.profileCompletion || 0}%</span>
                  <span>{freelancer.location || "Remoto"}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="font-subtitle font-semibold text-foreground">Disponible para proyectos</span>
                  <Link to="/freelancers" className="text-xs font-subtitle font-semibold text-foreground inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                    Contactar <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}

            {featuredFreelancers.length === 0 && (
              <div className="md:col-span-3 rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
                Aún no hay freelancers destacados.
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* TOP COMPANIES — mock dashboard estilo Jobfine */}
      <section id="empresas" className="py-20 bg-white relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="yellow-rect landing-rect-companies absolute hidden md:block" />
        </div>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div {...sectionReveal()}>
            <span className="inline-block text-[11px] font-subtitle font-semibold tracking-[0.2em] text-primary uppercase mb-4">
              Por qué elegirnos
            </span>
            <h2 className="font-fustat text-[1.9rem] sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.14] sm:leading-[1.1]">
              Las mejores empresas <br />
              ya publican <span className="text-primary">aquí</span>
            </h2>
            <p className="mt-5 text-base text-muted-foreground font-sans max-w-md leading-relaxed">
              Más de 8.400 empresas en LATAM confían en Joblify para encontrar talento verificado en minutos. Filtros
              inteligentes, ranking automático y un pipeline claro de principio a fin.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-xl font-subtitle font-semibold">
                <Link to="/register">Explorar vacantes</Link>
              </Button>
              <Button asChild variant="outline" className="border-border text-foreground hover:bg-surface-elevated h-11 px-6 rounded-xl font-subtitle font-semibold">
                <Link to="/register">Crear cuenta empresa</Link>
              </Button>
            </div>
          </motion.div>

          {/* Mock dashboard card */}
          <motion.div {...sectionReveal(0.12)} className="relative">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-[0_30px_60px_-30px_rgba(37,50,75,0.25)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 bg-surface-elevated rounded-lg px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-sans">Buscar empresa…</span>
                </div>
                <button className="bg-primary text-primary-foreground text-xs font-subtitle font-semibold px-4 py-2 rounded-lg">
                  Buscar
                </button>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="grid grid-cols-4 gap-2 mb-3 text-[10px] font-subtitle font-semibold text-muted-foreground uppercase tracking-wider px-3">
                    <span>Empresa</span><span>Salario</span><span>Tipo</span><span>Match</span>
                  </div>
                  <div className="space-y-2">
                    {jobs.slice(0, 4).map(j => (
                      <div key={j.id + "-mock"} className="grid grid-cols-4 gap-2 items-center bg-surface-elevated/60 rounded-lg px-3 py-2.5 text-xs font-sans">
                        <div className="flex items-center gap-2 min-w-0">
                          <CompanyLogo initial={j.companyLogo} size="sm" />
                          <span className="font-subtitle font-semibold text-foreground truncate">{j.company}</span>
                        </div>
                        <span className="text-muted-foreground truncate">{j.salary}</span>
                        <span className="text-muted-foreground">{j.type}</span>
                        <span className="font-subtitle font-semibold text-foreground">{j.modality}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating "Apply for the job" chip */}
            <div className="absolute -top-4 -right-2 bg-white border border-border rounded-xl px-3 py-2 shadow-[0_12px_30px_-10px_rgba(37,50,75,0.2)] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary fill-primary/20" />
              <span className="text-[11px] font-subtitle font-semibold text-foreground">Aplicar al empleo</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div {...sectionReveal()} className="bg-primary rounded-2xl p-8 sm:p-10 md:p-14 grid md:grid-cols-2 gap-6 md:gap-8 items-center relative overflow-hidden">
            <div className="relative z-10 text-center md:text-left">
              <h3 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.1]">
                Tu próximo<br />paso empieza aquí
              </h3>
              <p className="mt-5 text-base text-foreground/75 max-w-md md:max-w-none font-sans leading-relaxed md:pr-8">
                Encuentra talento verificado en minutos con matching inteligente.
              </p>
              <Button
                asChild
                className="mt-7 bg-foreground text-background hover:bg-foreground/90 h-12 px-7 rounded-xl font-subtitle font-semibold"
              >
                <Link to="/register">Crea tu cuenta gratis</Link>
              </Button>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="rounded-2xl border border-foreground/20 bg-white/35 px-6 py-5 space-y-3 min-w-[220px]">
                <p className="text-xs uppercase tracking-[0.14em] font-subtitle font-semibold text-foreground/65">Resultados reales</p>
                <p className="text-sm font-subtitle font-semibold text-foreground">+8.4K empresas activas</p>
                <p className="text-sm font-subtitle font-semibold text-foreground">120K perfiles registrados</p>
                <p className="text-sm font-subtitle font-semibold text-foreground">Match inteligente en segundos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI RECRUITER — sección negra */}
      <section className="py-14 md:py-20 bg-[hsl(218_30%_10%)] text-white relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="yellow-rect landing-rect-ai-1 absolute hidden md:block" />
          <div className="yellow-rect landing-rect-ai-2 absolute hidden md:block" />
        </div>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10 relative grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
          <motion.div {...sectionReveal()}>
            <span className="inline-block text-[10px] sm:text-[11px] font-subtitle font-semibold tracking-[0.2em] text-primary uppercase mb-3 sm:mb-4">
              Asistencia inteligente
            </span>
            <h2 className="font-fustat text-[1.75rem] leading-[1.15] sm:text-4xl md:text-5xl font-bold tracking-tight">
              Conoce el <span className="text-primary">asistente</span> de Joblify
            </h2>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/70 font-sans max-w-md leading-relaxed">
              Describe el rol o proyecto que buscas y recibe recomendaciones claras de vacantes y empresas que sí encajan contigo.
            </p>
            <Button
              asChild
              className="mt-6 sm:mt-7 bg-primary text-primary-foreground hover:bg-primary-hover h-11 md:h-12 px-6 md:px-7 rounded-xl font-subtitle font-semibold"
            >
              <Link to="/chat">Probar asistente</Link>
            </Button>
          </motion.div>

          {/* Chat mock */}
          <motion.div {...sectionReveal(0.12)} className="relative">
            <div className="space-y-3">
              {/* User msg */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-foreground font-subtitle font-semibold text-[10px] sm:text-xs flex items-center justify-center shrink-0">TU</div>
                <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-3.5 sm:px-4 py-2.5 sm:py-3">
                  <p className="text-[11px] sm:text-xs text-white/50 font-subtitle font-semibold mb-1">Tú</p>
                  <p className="text-[13px] sm:text-sm text-white/90 font-sans leading-relaxed">Busco un rol Senior Product Designer remoto en LATAM, con foco en design systems.</p>
                </div>
              </div>

              {/* Typing */}
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-white/40 font-sans pl-10 sm:pl-12">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                El asistente está buscando…
              </div>

              {/* AI response */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 bg-white/[0.07] border border-white/10 rounded-2xl rounded-tl-sm px-3.5 sm:px-4 py-2.5 sm:py-3">
                  <p className="text-[11px] sm:text-xs text-primary font-subtitle font-semibold mb-1.5 sm:mb-2">Asistente · 3 matches</p>
                  <p className="text-[13px] sm:text-sm text-white/90 font-sans mb-2.5 sm:mb-3 leading-relaxed">Encontré 3 vacantes que coinciden 90%+ con tu perfil:</p>
                  <div className="space-y-2">
                    {jobs.slice(0, 3).map(j => (
                      <div key={j.id + "-ai"} className="flex items-center gap-2.5 sm:gap-3 bg-white/5 rounded-lg px-2.5 sm:px-3 py-2">
                        <CompanyLogo initial={j.companyLogo} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] sm:text-xs font-subtitle font-semibold text-white truncate">{j.title}</p>
                          <p className="text-[10px] sm:text-[11px] text-white/50 font-sans truncate">{j.company} · {j.location}</p>
                        </div>
                        <span className="text-[11px] font-subtitle font-semibold text-primary shrink-0">{j.modality}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VACANTES MATCH */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
          <motion.div {...sectionReveal()} className="flex items-end justify-between gap-4 mb-12">
            <h2 className="font-fustat text-3xl md:text-5xl font-bold tracking-tight">
              Vacantes con las que haces <span className="text-primary">match</span>
            </h2>
            <Link to="/vacantes" className="hidden md:inline-flex items-center gap-1.5 text-sm font-subtitle font-semibold text-foreground hover:gap-2 transition-all">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerGrid}
            className="grid md:grid-cols-2 gap-x-10 gap-y-2"
          >
            {matchJobs.map(j => (
              <motion.div key={j.id + "-match"} variants={staggerItem}>
                <Link
                  to={`/vacantes/${j.id}`}
                  className="group flex items-center gap-3 sm:gap-4 py-4 border-b border-border hover:border-foreground transition-colors"
                >
                  <CompanyLogo initial={j.companyLogo} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-subtitle font-semibold text-sm text-foreground truncate">{j.title}</h3>
                    <p className="text-xs text-muted-foreground font-sans truncate">
                      {j.company} · {j.location}
                    </p>
                  </div>
                  {/* Mobile: salary chip */}
                  <span className="md:hidden text-[10px] font-subtitle font-semibold px-2 py-1 rounded-md bg-surface-elevated text-foreground shrink-0">
                    {j.type}
                  </span>
                  {/* Desktop: tags */}
                  <div className="hidden md:flex gap-1.5">
                    <span className="text-[10px] font-medium px-2 py-1 rounded-md border border-primary/40 text-foreground font-sans">
                      {j.type}
                    </span>
                    {j.skills.slice(0, 2).map((s, i) => (
                      <span
                        key={s}
                        className={cn(
                          "text-[10px] font-medium px-2 py-1 rounded-md font-sans",
                          i === 0 ? "border border-primary/40 text-foreground" : "border border-info/40 text-info"
                        )}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIOS — avatares dispersos */}
      <section id="comunidad" className="py-20 bg-surface-elevated/40 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
          <motion.div {...sectionReveal()} className="text-center mb-12">
            <span className="inline-block text-[11px] font-subtitle font-semibold tracking-[0.2em] text-primary uppercase mb-4">
              Comunidad Joblify
            </span>
            <h2 className="font-fustat text-3xl md:text-5xl font-bold tracking-tight">
              Conecta, comparte y crece con <span className="text-primary">talento LATAM</span>
            </h2>
            <p className="mt-4 text-sm md:text-base text-muted-foreground font-sans max-w-2xl mx-auto">
              Publica avances, encuentra recomendaciones y abre conversaciones con profesionales y empresas dentro del ecosistema Joblify.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-xl font-subtitle font-semibold">
                <Link to="/comunidad">Ver comunidad</Link>
              </Button>
              <Button asChild variant="outline" className="border-border text-foreground hover:bg-white h-11 px-6 rounded-xl font-subtitle font-semibold">
                <Link to="/register">Unirme gratis</Link>
              </Button>
            </div>
          </motion.div>

          {/* Floating avatars (desktop) */}
          <div aria-hidden className="hidden lg:block absolute inset-0 pointer-events-none">
            {[
              { l: "C", position: "landing-avatar-c", size: "h-14 w-14" },
              { l: "M", position: "landing-avatar-m", size: "h-10 w-10 opacity-70" },
              { l: "J", position: "landing-avatar-j", size: "h-12 w-12 opacity-90" },
              { l: "S", position: "landing-avatar-s", size: "h-14 w-14" },
              { l: "V", position: "landing-avatar-v", size: "h-10 w-10 opacity-70" },
              { l: "A", position: "landing-avatar-a", size: "h-12 w-12 opacity-90" },
            ].map((a, i) => (
              <span
                key={i}
                className={cn(
                  "absolute rounded-full bg-foreground text-background font-subtitle font-semibold text-sm flex items-center justify-center border-2 border-white shadow-[0_8px_20px_-8px_rgba(37,50,75,0.3)]",
                  a.position,
                  a.size
                )}
              >
                {a.l}
              </span>
            ))}
          </div>

          {/* Center testimonial card */}
          <motion.div {...sectionReveal(0.12)} className="max-w-2xl mx-auto bg-white border border-border rounded-2xl p-8 md:p-10 shadow-[0_30px_60px_-30px_rgba(37,50,75,0.15)] relative">
            <Quote className="h-8 w-8 text-primary mb-4" />
            <p className="text-lg md:text-xl text-foreground font-sans leading-relaxed">
              "{highlightedTestimonial.text}"
            </p>
            <div className="mt-6 flex items-center gap-3 pt-6 border-t border-border">
              <div className="h-11 w-11 rounded-full bg-primary text-foreground font-subtitle font-semibold flex items-center justify-center">
                {highlightedTestimonial.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-subtitle font-semibold text-sm text-foreground">{highlightedTestimonial.name}</p>
                <p className="text-xs text-muted-foreground font-sans">{highlightedTestimonial.role}</p>
              </div>
              <div className="ml-auto flex">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />)}
              </div>
            </div>
          </motion.div>

          {/* Dots */}
          <motion.div {...sectionReveal(0.2)} className="flex items-center justify-center gap-1.5 mt-8">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={cn("rounded-full transition-all", i === 0 ? "h-2 w-6 bg-foreground" : "h-2 w-2 bg-border")}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL — curva blanca decorativa */}
      <section className="bg-[hsl(218_30%_10%)] text-white relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="yellow-rect landing-rect-final absolute" />
        </div>
        {/* Curva blanca */}
        <svg
          aria-hidden
          className="absolute bottom-0 right-0 h-full w-1/2 text-white"
          viewBox="0 0 600 400"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M600 400 L600 0 Q300 200 0 400 Z" opacity="0.04" />
          <path d="M600 400 L600 100 Q350 280 100 400 Z" opacity="0.06" />
        </svg>

        <motion.div {...sectionReveal()} className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <p className="text-sm text-white/60 font-sans mb-3">¿Listo para tu próximo gran salto?</p>
            <h2 className="font-fustat text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Regístrate <span className="text-primary">aquí ahora</span>
              <ArrowRight className="inline-block ml-3 h-10 w-10 md:h-14 md:w-14 text-primary" strokeWidth={2.5} />
            </h2>
            <p className="mt-6 text-base text-white/70 font-sans max-w-md leading-relaxed">
              Únete a 120K+ profesionales de LATAM que ya están encontrando trabajo, freelance y proyectos reales.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary-hover h-12 px-7 rounded-xl font-subtitle font-semibold">
                <Link to="/register">Crear cuenta gratis</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white h-12 px-7 rounded-xl font-subtitle font-semibold">
                <Link to="/vacantes">Explorar vacantes</Link>
              </Button>
            </div>

            {/* Logos confianza — carrusel infinito */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <span className="text-xs text-white/40 font-sans block mb-5 tracking-wide">Confían en nosotros</span>
              <LogoMarquee variant="dark" />
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </PublicLayout>
  );
};

export default Landing;
