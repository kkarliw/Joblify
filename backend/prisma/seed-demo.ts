import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo2024!";

async function main() {
  console.log("Iniciando seed de datos demo...");

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Limpiar datos existentes (opcional - comentar si no quieres borrar)
  // await prisma.application.deleteMany();
  // await prisma.job.deleteMany();
  // await prisma.user.deleteMany();

  // 1. Crear usuarios demo
  console.log("Creando usuarios demo...");

  const candidatoDemo = await prisma.user.upsert({
    where: { email: "demo.candidato@joblify.com" },
    update: {},
    create: {
      email: "demo.candidato@joblify.com",
      passwordHash: hashedPassword,
      name: "María González",
      role: "candidato",
      headline: "Senior Product Designer",
      bio: "Soy diseñadora de producto con 6 años de experiencia en startups tech de LATAM. Me especializo en design systems, UX research y product strategy. He liderado equipos de diseño en Rappi y Mercado Libre, creando experiencias que impactan a millones de usuarios.",
      location: "Bogotá, Colombia",
      emailVerified: true,
      profileCompletion: 95,
    },
  });

  const empresaDemo = await prisma.user.upsert({
    where: { email: "demo.empresa@joblify.com" },
    update: {},
    create: {
      email: "demo.empresa@joblify.com",
      passwordHash: hashedPassword,
      name: "TechCorp LATAM",
      role: "empresa",
      headline: "Startup fintech en crecimiento",
      bio: "Fintech colombiana revolucionando pagos digitales en LATAM. Serie A de $15M liderada por a16z.",
      emailVerified: true,
      profileCompletion: 100,
    },
  });

  const freelancerDemo = await prisma.user.upsert({
    where: { email: "demo.freelancer@joblify.com" },
    update: {},
    create: {
      email: "demo.freelancer@joblify.com",
      passwordHash: hashedPassword,
      name: "Carlos Ramírez",
      role: "freelancer",
      headline: "Full Stack Developer & Tech Consultant",
      bio: "Desarrollador freelance con 8 años de experiencia. Especializado en React, Node.js y arquitecturas cloud. +50 proyectos completados con 5 estrellas.",
      emailVerified: true,
      profileCompletion: 90,
    },
  });

  // 2. Crear skills populares
  console.log("Creando skills...");

  const skillsData = [
    "React", "TypeScript", "Node.js", "Python", "Figma", "Product Design",
    "UX Research", "SQL", "AWS", "Docker", "Kubernetes", "GraphQL",
    "Next.js", "TailwindCSS", "Product Management", "Data Analysis",
    "Machine Learning", "Swift", "Kotlin", "Flutter", "Vue.js", "Angular"
  ];

  const skills = await Promise.all(
    skillsData.map(name =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // Asignar skills al candidato demo
  await prisma.userSkill.createMany({
    data: [
      { userId: candidatoDemo.id, skillId: skills.find(s => s.name === "Figma")!.id },
      { userId: candidatoDemo.id, skillId: skills.find(s => s.name === "Product Design")!.id },
      { userId: candidatoDemo.id, skillId: skills.find(s => s.name === "UX Research")!.id },
      { userId: candidatoDemo.id, skillId: skills.find(s => s.name === "React")!.id },
    ],
    skipDuplicates: true,
  });

  // 3. Crear categorías de vacantes
  console.log("Creando categorías...");

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: "Diseño" }, update: {}, create: { name: "Diseño" } }),
    prisma.category.upsert({ where: { name: "Desarrollo" }, update: {}, create: { name: "Desarrollo" } }),
    prisma.category.upsert({ where: { name: "Producto" }, update: {}, create: { name: "Producto" } }),
    prisma.category.upsert({ where: { name: "Marketing" }, update: {}, create: { name: "Marketing" } }),
    prisma.category.upsert({ where: { name: "Datos" }, update: {}, create: { name: "Datos" } }),
  ]);

  // 4. Crear empresas adicionales
  console.log("Creando empresas...");

  const empresas = await Promise.all([
    prisma.user.upsert({
      where: { email: "rh@rappi.com" },
      update: {},
      create: {
        email: "rh@rappi.com",
        passwordHash: hashedPassword,
        name: "Rappi",
        role: "empresa",
        headline: "Super app líder en LATAM",
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "talent@mercadolibre.com" },
      update: {},
      create: {
        email: "talent@mercadolibre.com",
        passwordHash: hashedPassword,
        name: "Mercado Libre",
        role: "empresa",
        headline: "E-commerce #1 de LATAM",
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "careers@nubank.com" },
      update: {},
      create: {
        email: "careers@nubank.com",
        passwordHash: hashedPassword,
        name: "Nubank",
        role: "empresa",
        headline: "Fintech más grande de LATAM",
        emailVerified: true,
      },
    }),
  ]);

  // 5. Crear vacantes realistas
  console.log("Creando vacantes...");

  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: "Senior Product Designer",
        description: "Buscamos un Senior Product Designer para liderar el diseño de nuestra app principal. Trabajarás con equipos de producto e ingeniería para crear experiencias excepcionales para millones de usuarios en LATAM.",
        requirements: "6+ años de experiencia en product design, dominio de Figma, experiencia con design systems, portfolio sólido",
        location: "Bogotá, Colombia",
        modality: "Híbrido",
        type: "Tiempo completo",
        salaryMin: 4500,
        salaryMax: 6000,
        salaryCurrency: "USD",
        status: "ACTIVE",
        posterId: empresas[0].id,
        categoryId: categories[0].id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Product Designer",
        description: "Únete a nuestro equipo de diseño para crear productos que impacten a millones. Trabajarás en proyectos de e-commerce, fintech y logística.",
        requirements: "4+ años de experiencia, Figma avanzado, UX research, trabajo en equipo",
        location: "Remoto LATAM",
        modality: "Remoto",
        type: "Tiempo completo",
        salaryMin: 4000,
        salaryMax: 5500,
        salaryCurrency: "USD",
        status: "ACTIVE",
        posterId: empresas[1].id,
        categoryId: categories[0].id,
      },
    }),
    prisma.job.create({
      data: {
        title: "UX Lead",
        description: "Lidera el equipo de UX de nuestra fintech. Define la estrategia de experiencia de usuario y trabaja directamente con el CPO.",
        requirements: "8+ años en UX/UI, experiencia liderando equipos, fintech experience, inglés fluido",
        location: "São Paulo, Brasil",
        modality: "Híbrido",
        type: "Tiempo completo",
        salaryMin: 5000,
        salaryMax: 7000,
        salaryCurrency: "USD",
        status: "ACTIVE",
        posterId: empresas[2].id,
        categoryId: categories[0].id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Full Stack Developer",
        description: "Desarrollador full stack para trabajar en nuestra plataforma de pagos. Stack: React, Node.js, PostgreSQL, AWS.",
        requirements: "5+ años de experiencia, React, Node.js, bases de datos, microservicios",
        location: "Medellín, Colombia",
        modality: "Híbrido",
        type: "Tiempo completo",
        salaryMin: 3500,
        salaryMax: 5000,
        salaryCurrency: "USD",
        status: "ACTIVE",
        posterId: empresaDemo.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Frontend Developer React",
        description: "Buscamos frontend developer para nuestro equipo de producto. Trabajarás con React, TypeScript y Next.js en proyectos de alto impacto.",
        requirements: "3+ años con React, TypeScript, Next.js, TailwindCSS, testing",
        location: "Remoto LATAM",
        modality: "Remoto",
        type: "Tiempo completo",
        salaryMin: 3000,
        salaryMax: 4500,
        salaryCurrency: "USD",
        status: "ACTIVE",
        posterId: empresas[0].id,
        categoryId: categories[1].id,
      },
    }),
  ]);

  // 6. Asignar skills a vacantes
  console.log("Asignando skills a vacantes...");

  await prisma.jobSkill.createMany({
    data: [
      { jobId: jobs[0].id, skillId: skills.find(s => s.name === "Figma")!.id },
      { jobId: jobs[0].id, skillId: skills.find(s => s.name === "Product Design")!.id },
      { jobId: jobs[0].id, skillId: skills.find(s => s.name === "UX Research")!.id },
      { jobId: jobs[1].id, skillId: skills.find(s => s.name === "Figma")!.id },
      { jobId: jobs[1].id, skillId: skills.find(s => s.name === "Product Design")!.id },
      { jobId: jobs[2].id, skillId: skills.find(s => s.name === "Product Design")!.id },
      { jobId: jobs[2].id, skillId: skills.find(s => s.name === "UX Research")!.id },
      { jobId: jobs[3].id, skillId: skills.find(s => s.name === "React")!.id },
      { jobId: jobs[3].id, skillId: skills.find(s => s.name === "Node.js")!.id },
      { jobId: jobs[4].id, skillId: skills.find(s => s.name === "React")!.id },
      { jobId: jobs[4].id, skillId: skills.find(s => s.name === "TypeScript")!.id },
    ],
    skipDuplicates: true,
  });

  // 7. Crear aplicaciones del candidato demo
  console.log("Creando aplicaciones...");

  await prisma.application.createMany({
    data: [
      {
        applicantId: candidatoDemo.id,
        jobId: jobs[0].id,
        status: "ENTREVISTA",
        matchScore: 96,
        aiExplanation: "Excelente match: 6 años de experiencia en product design, dominio de Figma y design systems, experiencia en startups tech LATAM",
      },
      {
        applicantId: candidatoDemo.id,
        jobId: jobs[1].id,
        status: "SCREENING",
        matchScore: 91,
        aiExplanation: "Muy buen match: skills alineadas, experiencia relevante en e-commerce, portfolio sólido",
      },
      {
        applicantId: candidatoDemo.id,
        jobId: jobs[2].id,
        status: "APLICADO",
        matchScore: 89,
        aiExplanation: "Buen match: experiencia liderando equipos, conocimiento de fintech, inglés fluido",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completado exitosamente!");
  console.log("\nCredenciales demo:");
  console.log("Candidato: demo.candidato@joblify.com / Demo2024!");
  console.log("Empresa: demo.empresa@joblify.com / Demo2024!");
  console.log("Freelancer: demo.freelancer@joblify.com / Demo2024!");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
