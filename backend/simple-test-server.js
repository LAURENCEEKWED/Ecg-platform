
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from simple server!');
});

server.listen(5000, 'localhost', () => {
  console.log('✅ Test server running on http://localhost:5000');
});

