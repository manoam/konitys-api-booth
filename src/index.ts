import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

import borneRoutes from './routes/borne.routes';
import { connectRabbitMQ, closeRabbitMQ } from './services/rabbitmq.service';
import { initWebSocket, closeWebSocket } from './services/websocket.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(helmet());
// CORS géré par nginx
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'konitys-api-booth',
    timestamp: new Date().toISOString(),
  });
});

// Routes API
app.use('/api/booth/bornes', borneRoutes);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
  });
});

// Gestion des erreurs
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
  });
});

async function start() {
  try {
    // Créer le serveur HTTP
    const server = createServer(app);

    // Initialiser WebSocket
    initWebSocket(server);

    // Connexion à RabbitMQ
    await connectRabbitMQ();

    server.listen(PORT, () => {
      console.log(`🚀 API Booth running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api/booth`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  closeWebSocket();
  await closeRabbitMQ();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  closeWebSocket();
  await closeRabbitMQ();
  process.exit(0);
});

start();
