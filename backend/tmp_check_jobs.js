const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  const rows = await prisma.job.findMany({
    where: {
      OR: [
        { title: "Senior Product Designer" },
        { title: "Backend Engineer (Go)" },
      ],
    },
    select: {
      id: true,
      title: true,
      isActive: true,
      poster: { select: { name: true } },
    },
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
