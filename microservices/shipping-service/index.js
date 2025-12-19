const express = require('express');
const { Kafka } = require('kafkajs');
const pino = require('pino');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3010;
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const TOPIC = process.env.TOPIC || 'order.created';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://colorcom:colorcom123@postgres:5432/colorcom_shipments';

let consumer;
let prisma;

try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
} catch (e) {
  log.warn('Prisma client not available at startup, operations will skip persistence until available');
}

app.get('/shipping/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/shipping/shipments/:orderId', (req, res) => {
  // Mocked response — in real service this would query a DB
  const { orderId } = req.params;
  res.json({ orderId, status: 'created', carrier: 'MockCarrier', trackingId: `TRK-${orderId}` });
});

app.get('/shipping/shipments', async (req, res) => {
  // List shipments with optional tenantId and limit
  const { tenantId, limit = 50 } = req.query;
  if (!prisma) {
    return res.status(503).json({ error: 'persistence not available' });
  }
  try {
    const where = tenantId ? { tenantId: String(tenantId) } : {};
    const shipments = await prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, take: Number(limit) });
    res.json({ count: shipments.length, shipments });
  } catch (err) {
    log.error({ err: err.message }, 'Failed to list shipments');
    res.status(500).json({ error: 'failed to list shipments' });
  }
});

async function startKafkaConsumer() {
  const kafka = new Kafka({ brokers: KAFKA_BROKERS, clientId: 'shipping-service' });
  consumer = kafka.consumer({ groupId: `shipping-service-${Math.floor(Math.random()*10000)}` });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = message.value ? message.value.toString() : '{}';
        log.info({ topic, partition }, 'Received message');
        const data = JSON.parse(payload);
        // Simulate creating a shipment for the order
        const orderId = data.id || data.orderId || (data.payload && data.payload.id) || null;
        log.info({ orderId, payload: data }, 'Creating shipment');
        // In a real implementation, call courier API here and persist shipment
        // Simulate async work
        await new Promise((r) => setTimeout(r, 300));
        const trackingId = `TRK-${orderId}`;
        log.info({ orderId, trackingId }, 'Shipment created');
        if (prisma) {
          try {
            await prisma.shipment.create({
              data: {
                tenantId: data.tenantId || 'default',
                orderId: orderId || 'unknown',
                status: 'created',
                carrier: 'MockCarrier',
                trackingId,
              }
            });
            log.info('Shipment persisted');
          } catch (err) {
            log.error({ err: err.message }, 'Failed to persist shipment');
          }
        }
      } catch (err) {
        log.error({ err: err.message }, 'Failed to process message');
      }
    }
  });
}

async function start() {
  app.listen(PORT, async () => {
    log.info({ port: PORT }, 'Shipping service listening');
    try {
      await startKafkaConsumer();
      log.info('Kafka consumer started');
    } catch (err) {
      log.error({ err: err.message }, 'Failed to start Kafka consumer (will continue and retry)');
      // do not crash; consumer can be retried by orchestration
    }
  });
}

process.on('SIGINT', async () => {
  try {
    if (consumer) await consumer.disconnect();
  } catch (e) {}
  process.exit(0);
});

start().catch((err) => {
  log.error({ err: err.message }, 'Service failed to start');
  process.exit(1);
});
