import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando datos demo de Joblify...");

  const pass = await bcrypt.hash("Demo1234!", 12);

  // Usuarios demo por rol
  const empresa = await prisma.user.upsert({
    where: { email: "empresa@demo.joblify.io" },
    update: {},
    create: {
      email: "empresa@demo.joblify.io", passwordHash: pass, name: "Rappi Tech",
      role: "EMPRESA", headline: "Plataforma de delivery líder en LATAM",
      bio: "Construimos el futuro del delivery con equipos apasionados.",
      location: "Bogotá, Colombia", isVerified: true, profileCompletion: 90,
    },
  });

  const candidato = await prisma.user.upsert({
    where: { email: "candidato@demo.joblify.io" },
    update: {},
    create: {
      email: "candidato@demo.joblify.io", passwordHash: pass, name: "Camila Rodríguez",
      role: "CANDIDATO", headline: "Senior Product Designer · Design Systems",
      bio: "Diseñadora con 6 años en productos B2B. Foco en research y sistemas de diseño escalables.",
      location: "Bogotá, Colombia", profileCompletion: 78,
    },
  });

  const freelancer = await prisma.user.upsert({
    where: { email: "freelancer@demo.joblify.io" },
    update: {},
    create: {
      email: "freelancer@demo.joblify.io", passwordHash: pass, name: "Diego Hernández",
      role: "FREELANCER", headline: "Brand & UI Designer · Top Rated",
      bio: "Diseño identidades y productos digitales para startups LATAM. Entrega rápida, calidad premium.",
      location: "Medellín, Colombia", isVerified: true, profileCompletion: 95,
    },
  });

  const emprendedor = await prisma.user.upsert({
    where: { email: "emprendedor@demo.joblify.io" },
    update: {},
    create: {
      email: "emprendedor@demo.joblify.io", passwordHash: pass, name: "Andrés Vega",
      role: "EMPRENDEDOR", headline: "Founder @ HealthOS · Buscando CTO",
      bio: "Construyendo el OS de salud digital para LATAM. Ex-Rappi, ex-Nubank.",
      location: "Ciudad de México", profileCompletion: 82,
    },
  });

  const estudiante = await prisma.user.upsert({
    where: { email: "estudiante@demo.joblify.io" },
    update: {},
    create: {
      email: "estudiante@demo.joblify.io", passwordHash: pass, name: "Valentina Pino",
      role: "ESTUDIANTE", headline: "Ing. de Sistemas · Buscando primera práctica",
      bio: "Estudiante de último año en Uniandes. Proyectos en React y Python.",
      location: "Bogotá, Colombia", profileCompletion: 55,
    },
  });

  // Skills comunes
  const skillNames = ["Figma", "React", "TypeScript", "Python", "Node.js", "Design Systems", "Research", "SQL", "Go", "Swift"];
  const skills: Record<string, { id: string }> = {};
  for (const name of skillNames) {
    skills[name] = await prisma.skill.upsert({ where: { name }, create: { name }, update: {} });
  }

  // Skills del candidato
  for (const s of ["Figma", "Design Systems", "Research"]) {
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: candidato.id, skillId: skills[s].id } },
      create: { userId: candidato.id, skillId: skills[s].id, level: 5 },
      update: {},
    });
  }

  // Categorías de trabajo
  const categories = ["Tecnología", "Diseño", "Marketing", "Finanzas", "Ventas", "Recursos Humanos"];
  const cats: Record<string, { id: string }> = {};
  for (const name of categories) {
    cats[name] = await prisma.jobCategory.upsert({ where: { name }, create: { name }, update: {} });
  }

  // Vacantes demo
  const job1 = await prisma.job.create({
    data: {
      posterId: empresa.id,
      title: "Senior Product Designer",
      description: "Lideramos la próxima evolución del producto de delivery. Buscamos un diseñador con visión sistémica y obsesión por el detalle.",
      requirements: "5+ años experiencia, dominio de Figma y Design Systems, experiencia en productos B2C.",
      benefits: "Salario competitivo, trabajo híbrido, stock options, seguro médico.",
      location: "Bogotá, Colombia",
      modality: "HIBRIDO",
      type: "FULL_TIME",
      salaryMin: 4500,
      salaryMax: 6000,
      salaryCurrency: "USD",
      isFeatured: true,
      categoryId: cats["Diseño"].id,
      skills: {
        create: [
          { skillId: skills["Figma"].id },
          { skillId: skills["Design Systems"].id },
          { skillId: skills["Research"].id },
        ],
      },
    },
  });

  const job2 = await prisma.job.create({
    data: {
      posterId: empresa.id,
      title: "Backend Engineer (Go)",
      description: "Construimos infraestructura para 100M+ usuarios. Equipo distribuido, fuerte cultura de ownership.",
      requirements: "3+ años en Go o Rust, experiencia con sistemas distribuidos, Kafka.",
      location: "Remoto LATAM",
      modality: "REMOTO",
      type: "FULL_TIME",
      salaryMin: 5000,
      salaryMax: 7500,
      salaryCurrency: "USD",
      isFeatured: true,
      categoryId: cats["Tecnología"].id,
      skills: {
        create: [{ skillId: skills["Go"].id }, { skillId: skills["SQL"].id }],
      },
    },
  });

  // Aplicación demo
  await prisma.application.upsert({
    where: { jobId_applicantId: { jobId: job1.id, applicantId: candidato.id } },
    update: {},
    create: {
      jobId: job1.id,
      applicantId: candidato.id,
      status: "SCREENING",
      matchScore: 96,
      aiExplanation: "Excelente match: domina Figma y Design Systems · 6 años experiencia relevante · Portafolio B2B sólido",
      coverLetter: "Me apasiona construir design systems que escalen. He liderado el design system de 3 productos con +1M usuarios.",
    },
  });

  // Startup demo
  const startup = await prisma.startup.create({
    data: {
      founderId: emprendedor.id,
      name: "HealthOS",
      tagline: "El sistema operativo de salud digital para LATAM",
      description: "Conectamos pacientes, médicos y farmacias en un solo ecosistema inteligente.",
      stage: "Seed",
      sector: "HealthTech",
      isActive: true,
      openRoles: {
        create: [
          { title: "CTO Co-founder", description: "Buscamos CTO técnico con experiencia en sistemas de salud.", equityMin: 15, equityMax: 25 },
          { title: "Diseñador Fundador", description: "Head of Design para construir la experiencia de pacientes.", equityMin: 5, equityMax: 10 },
        ],
      },
    },
  });

  // Servicio freelance demo
  await prisma.freelanceService.create({
    data: {
      freelancerId: freelancer.id,
      title: "Diseño de identidad visual completa",
      description: "Logo, paleta, tipografía, brand book y assets para redes. Incluye 3 rondas de revisión.",
      category: "Branding",
      priceMin: 1200,
      priceMax: 2400,
      currency: "USD",
      deliveryDays: 14,
    },
  });

  // Post en el feed
  await prisma.post.create({
    data: {
      authorId: candidato.id,
      content: "Acabo de completar mi perfil en Joblify y ya tengo 3 matches en 24 horas 🎉 El AI Recruiter es increíble para filtrar vacantes relevantes.",
      tag: "Logro",
    },
  });

  // Conversación demo
  const conv = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: empresa.id }, { userId: candidato.id }],
      },
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conv.id, senderId: empresa.id, receiverId: candidato.id, content: "Hola Camila, vi tu perfil y me gustaría agendar una llamada para la posición de Senior Product Designer.", isRead: true },
      { conversationId: conv.id, senderId: candidato.id, receiverId: empresa.id, content: "¡Hola! Claro, estoy muy interesada. Esta semana tengo disponibilidad.", isRead: true },
      { conversationId: conv.id, senderId: empresa.id, receiverId: candidato.id, content: "¿Te parece el jueves a las 11am? Sería con el Head of Design.", isRead: false },
    ],
  });

  console.log("✅ Seed completado. Usuarios demo:");
  console.log("   candidato@demo.joblify.io / Demo1234!");
  console.log("   empresa@demo.joblify.io / Demo1234!");
  console.log("   freelancer@demo.joblify.io / Demo1234!");
  console.log("   emprendedor@demo.joblify.io / Demo1234!");
  console.log("   estudiante@demo.joblify.io / Demo1234!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
