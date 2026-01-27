import amqplib from 'amqplib';
import { BorneModel } from '../models/borne.model';
import { broadcast } from './websocket.service';

type Connection = Awaited<ReturnType<typeof amqplib.connect>>;
type Channel = Awaited<ReturnType<Connection['createChannel']>>;

let connection: Connection | null = null;
let channel: Channel | null = null;

const EXCHANGE_NAME = 'konitys.events';

// Configuration des queues séparées
const QUEUES = [
  { name: 'booth.antenne.deleted', routingKey: 'antenne.deleted' },
  { name: 'booth.antenne.deactivated', routingKey: 'antenne.deactivated' },
  { name: 'booth.antenne.updated', routingKey: 'antenne.updated' },
];

export async function connectRabbitMQ(): Promise<void> {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://konitys:rabbitmq_dev_2024@localhost:5672';

  try {
    connection = await amqplib.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    // Déclarer l'exchange (doit correspondre à celui de l'API Antennes)
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Créer et configurer chaque queue
    for (const queue of QUEUES) {
      // Déclarer la queue
      await channel.assertQueue(queue.name, { durable: true });

      // Lier la queue à l'exchange avec son routing key
      await channel.bindQueue(queue.name, EXCHANGE_NAME, queue.routingKey);

      // Consommer les messages de cette queue
      await channel.consume(queue.name, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`📨 Message reçu [${queue.routingKey}]:`, content);

            await handleAntenneEvent(queue.routingKey, content);

            channel?.ack(msg);
          } catch (error) {
            console.error(`Erreur traitement message [${queue.name}]:`, error);
            channel?.nack(msg, false, false);
          }
        }
      });

      console.log(`  ✓ Queue "${queue.name}" → ${queue.routingKey}`);
    }

    // Gérer la fermeture de connexion avec reconnexion automatique
    connection.on('close', () => {
      console.log('RabbitMQ connection closed, reconnecting...');
      channel = null;
      connection = null;
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on('error', (err: Error) => {
      console.error('RabbitMQ connection error:', err);
    });

    console.log(`🐰 RabbitMQ connected - Listening on ${QUEUES.length} queues`);
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
}

interface AntenneEventData {
  antenneId: number;
  data?: {
    id: number;
    prenom: string;
    nom: string;
    etat: string;
  };
}

async function handleAntenneEvent(routingKey: string, eventData: AntenneEventData): Promise<void> {
  const { antenneId } = eventData;

  switch (routingKey) {
    case 'antenne.deleted':
      console.log(`🗑️ Antenne ${antenneId} supprimée - Détachement des bornes...`);
      await detachBornesFromAntenne(antenneId);
      // Notifier les clients WebSocket
      broadcast('antenne.deleted', { antenneId });
      break;

    case 'antenne.deactivated':
      console.log(`⏸️ Antenne ${antenneId} désactivée - Détachement des bornes...`);
      await detachBornesFromAntenne(antenneId);
      // Notifier les clients WebSocket
      broadcast('antenne.deactivated', { antenneId });
      break;

    case 'antenne.updated':
      console.log(`✏️ Antenne ${antenneId} mise à jour`);
      // Notifier les clients WebSocket avec les nouvelles données
      broadcast('antenne.updated', eventData.data);
      break;

    default:
      console.log(`❓ Événement inconnu: ${routingKey}`);
      return;
  }
}

async function detachBornesFromAntenne(antenneId: number): Promise<void> {
  try {
    const result = await BorneModel.detachFromAntenne(antenneId);
    console.log(`✅ ${result} borne(s) détachée(s) de l'antenne ${antenneId}`);
  } catch (error) {
    console.error(`❌ Erreur lors du détachement des bornes:`, error);
    throw error;
  }
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ:', error);
  }
}
