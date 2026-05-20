const { execSync } = require('child_process');

try {
  console.log('Starting Joblify Backend...');
  execSync('npx tsx src/index.ts', { 
    cwd: __dirname, 
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('Failed to start:', error.message);
  process.exit(1);
}
