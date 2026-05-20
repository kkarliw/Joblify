const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Conectando a BD...');
    
    // Test 1: Verificar que la tabla tiene los campos
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationToken: true,
        resetPasswordToken: true,
        resetPasswordExpires: true,
      }
    });
    
    console.log('✅ Campos encontrados en BD:');
    console.log(JSON.stringify(user, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
