import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: HttpServer): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 Client WebSocket connecté');

    ws.on('close', () => {
      console.log('🔌 Client WebSocket déconnecté');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Envoyer un message de bienvenue
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connexion WebSocket établie',
      timestamp: new Date().toISOString(),
    }));
  });

  console.log('🔌 WebSocket server initialized on /ws');
}

export function broadcast(event: string, data: unknown): void {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  const message = JSON.stringify({
    type: event,
    data,
    timestamp: new Date().toISOString(),
  });

  let clientCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      clientCount++;
    }
  });

  if (clientCount > 0) {
    console.log(`📤 Broadcast [${event}] envoyé à ${clientCount} client(s)`);
  }
}

export function closeWebSocket(): void {
  if (wss) {
    wss.close();
    console.log('WebSocket server closed');
  }
}
