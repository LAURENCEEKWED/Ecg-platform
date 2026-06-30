const WebSocket = require('ws');

let wssInstance = null;
const clients = new Map(); // userId -> ws

function setupWebSocket(wss) {
  wssInstance = wss;

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role');

    if (userId) {
      clients.set(userId, { ws, role });
      console.log(`WebSocket connected: user ${userId} (${role})`);
    }

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'PING') ws.send(JSON.stringify({ type: 'PONG' }));
      } catch {}
    });

    ws.on('close', () => {
      if (userId) clients.delete(userId);
    });

    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSocket connection established' }));
  });
}

function broadcast(event) {
  if (!wssInstance) return;
  const message = JSON.stringify(event);
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(message);
  });
}

function sendToUser(userId, event) {
  const client = clients.get(String(userId));
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(event));
  }
}

function sendToRole(role, event) {
  clients.forEach(({ ws, role: r }) => {
    if (r === role && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  });
}

module.exports = { setupWebSocket, broadcast, sendToUser, sendToRole };
