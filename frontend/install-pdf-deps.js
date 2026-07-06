
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Installing PDF dependencies... ===');

try {
  console.log('Installing jspdf...');
  execSync('npm install jspdf --save', { stdio: 'inherit' });
  console.log('Installing jspdf-autotable...');
  execSync('npm install jspdf-autotable --save', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!');
  
  console.log('\n=== Checking installed packages... ===');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  console.log('jspdf exists:', fs.existsSync(path.join(nodeModulesPath, 'jspdf')));
  console.log('jspdf-autotable exists:', fs.existsSync(path.join(nodeModulesPath, 'jspdf-autotable')));
  
  const pkgPath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  console.log('package.json dependencies:', pkg.dependencies);
} catch (err) {
  console.error('❌ Error installing dependencies:', err);
  process.exit(1);
}
