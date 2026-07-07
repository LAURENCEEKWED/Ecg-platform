
console.log('Testing dependencies...');
try {
  const express = require('express');
  console.log('✅ express loaded');
  
  const http = require('http');
  console.log('✅ http loaded');
  
  const WebSocket = require('ws');
  console.log('✅ ws loaded');
  
  console.log('\n✅ All core dependencies are available!');
  
  // Try to start a simple server to test
  const app = express();
  const server = http.createServer(app);
  
  app.get('/test', (req, res) => res.json({ ok: true }));
  
  server.listen(0, () => {
    const port = server.address().port;
    console.log(`✅ Test server listening on port ${port}`);
    server.close();
    console.log('\n✅ Test passed! Now let\'s start the actual backend!');
    console.log('\nStarting ECG AI Platform backend...');
    require('./src/server.js');
  });
  
} catch (err) {
  console.error('\n❌ Error:', err);
  console.error('\nPlease run: npm install');
}

