const { execSync } = require('child_process');
try {
  console.log('Running prisma db push --accept-data-loss ...');
  console.log(execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' }));
  console.log('Done!');
} catch(e) {
  console.error(e);
}
