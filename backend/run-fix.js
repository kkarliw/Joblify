const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDB() {
  try {
    console.log('Aplicando fix a la BD en Supabase...');
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationToken" TEXT;`);
    console.log('✅ Agregado verificationToken');
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;`);
    console.log('✅ Agregado emailVerified');
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT;`);
    console.log('✅ Agregado resetPasswordToken');
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP(3);`);
    console.log('✅ Agregado resetPasswordExpires');
    
    console.log('¡Base de datos arreglada exitosamente!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixDB();
