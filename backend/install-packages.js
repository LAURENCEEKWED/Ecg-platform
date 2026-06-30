
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Installing required packages...\n');

const packages = [
  'twilio@^4.20.0',
  'nodemailer@^6.9.7'
];

function installPackage(pkg) {
  return new Promise((resolve, reject) => {
    console.log(`   Installing ${pkg}...`);
    exec(`npm.cmd install ${pkg}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`   ❌ Error installing ${pkg}:`, error.message);
        reject(error);
      } else {
        console.log(`   ✅ ${pkg} installed`);
        resolve();
      }
    });
  });
}

async function installAll() {
  try {
    for (const pkg of packages) {
      await installPackage(pkg);
    }
    console.log('\n✅ All packages installed successfully!');
  } catch (e) {
    console.error('\n❌ Installation failed');
  }
}

installAll();
