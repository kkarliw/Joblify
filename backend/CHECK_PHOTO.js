const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({ where: { name: 'karla' } });
  console.log('--- RESULTADOS EN LA BD ---');
  if (!user) {
    console.log('Usuario karla no encontrado');
  } else {
    console.log('AvatarUrl (Oficial):', user.avatarUrl ? 'SI HAY FOTO (' + user.avatarUrl.substring(0, 30) + '...)' : 'VACIO');
    console.log('CoverUrl (Oficial):', user.coverUrl ? 'SI HAY PORTADA' : 'VACIO');
    
    // Revisar dentro de profileData por si acaso
    const pData = typeof user.profileData === 'string' ? JSON.parse(user.profileData) : (user.profileData || {});
    console.log('AvatarUrl (Oculto en profileData):', pData.avatarUrl ? 'SI HAY FOTO OCULTA' : 'VACIO');
  }
}
check();
