const { execSync } = require('child_process');
try {
  console.log('Running prisma generate...');
  console.log(execSync('npx prisma generate', { stdio: 'inherit' }));
  console.log('Running prisma db push...');
  console.log(execSync('npx prisma db push', { stdio: 'inherit' }));
  console.log('Done!');
} catch(e) {
  console.error(e);
}
