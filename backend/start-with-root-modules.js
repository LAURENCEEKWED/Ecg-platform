
const path = require('path');

// Add root node_modules to require path
const rootNodeModules = path.join(__dirname, '..', 'node_modules');
const originalRequirePaths = require('module').Module.globalPaths.slice();
require('module').Module.globalPaths.unshift(rootNodeModules);

console.log('🔧 Using root node_modules:', rootNodeModules);

// Now require server
console.log('🚀 Starting backend server...');
require('./src/server');

