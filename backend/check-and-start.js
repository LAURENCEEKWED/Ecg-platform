
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

console.log('🔍 Checking backend setup...');

const nodeModulesPath = path.join(__dirname, 'node_modules');
const packageJsonPath = path.join(__dirname, 'package.json');

if (!fs.existsSync(nodeModulesPath)) {
  console.log('⚠️ node_modules not found! Installing dependencies...');
  try {
    execSync('npm.cmd install', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (err) {
    console.error('❌ Failed to install dependencies!', err);
    process.exit(1);
  }
} else {
  console.log('✅ node_modules exists');
}

console.log('\n🚀 Starting backend server...');
const server = spawn('node', [path.join(__dirname, 'src', 'server.js')], {
  cwd: __dirname,
  stdio: 'inherit'
});

server.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

