const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY column_name;
  `);
  console.log(rows);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); prisma.$disconnect(); });
