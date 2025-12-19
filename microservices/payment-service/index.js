const { Hono } = require('hono');

// Minimal HTTP server wrapper for Hono without adding @hono/node-server dependency
function serve({ fetch, port }, cb) {
  const http = require('http');
  const server = http.createServer(async (req, res) => {
    try {
      const url = `http://${req.headers.host}${req.url}`;
      const headers = {};
      for (const [k, v] of Object.entries(req.headers)) headers[k] = v;
      const request = new Request(url, { method: req.method, headers, body: req });
      const response = await fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const buf = Buffer.from(await response.arrayBuffer());
      res.end(buf);
    } catch (err) {
      console.error('Server error', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  server.listen(port, () => cb && cb({ port }));
  return server;
}
const pino = require('pino');
const { Pool } = require('pg');
const { Kafka } = require('kafkajs');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = new Hono();

const PORT = process.env.PORT || 3009;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://colorcom:colorcom123@postgres:5432/colorcom_payments';
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');

const pool = new Pool({ connectionString: DATABASE_URL });
const kafka = new Kafka({ brokers: KAFKA_BROKERS, clientId: 'payment-service' });
let producer;

async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(100) NOT NULL,
        order_id VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'BDT',
        status VARCHAR(50) DEFAULT 'pending',
        gateway VARCHAR(50) NOT NULL,
        gateway_txn_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT now()
      );
    `);
  } finally {
    client.release();
  }
}

async function publishEvent(topic, payload) {
  try {
    if (!producer) {
      producer = kafka.producer();
      await producer.connect();
      log.info('Kafka producer connected');
    }
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
    log.info(`Event published to ${topic}`);
  } catch (err) {
    log.error({ err: (err && err.message) || String(err) }, `Failed to publish event to ${topic}`);
  }
}

app.get('/payment/health', (c) => c.json({ status: 'ok' }));

app.post('/payment/webhook/bkash', async (c) => {
  try {
    const payload = await c.req.json();
    log.info({ payload }, 'Received bkash webhook');

    const { tenantId, orderId, amount, trxID, status } = payload;
    if (!tenantId || !orderId || !amount) {
      return c.json({ error: 'missing fields' }, 400);
    }

    // Store payment record
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO payments (tenant_id, order_id, amount, status, gateway, gateway_txn_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [tenantId, orderId, amount, status || 'completed', 'bkash', trxID]
      );
    } finally {
      client.release();
    }

    if (status === 'completed' || status === 'success') {
      await publishEvent('payment.success', {
        tenantId,
        orderId,
        amount,
        gateway: 'bkash',
        trxID,
        timestamp: new Date(),
      });
    } else {
      await publishEvent('payment.failed', { tenantId, orderId, amount, gateway: 'bkash', trxID, status, timestamp: new Date() });
    }

    return c.json({ acknowledged: true });
  } catch (err) {
    log.error({ err: err.message }, 'Webhook processing failed');
    return c.json({ error: 'processing failed' }, 500);
  }
});

app.post('/payment/webhook/sslcommerz', async (c) => {
  try {
    const payload = await c.req.json();
    log.info({ payload }, 'Received sslcommerz webhook');

    const { tenantId, orderId, amount, val_id, status } = payload;
    if (!tenantId || !orderId || !amount) {
      return c.json({ error: 'missing fields' }, 400);
    }

    // Store payment record
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO payments (tenant_id, order_id, amount, status, gateway, gateway_txn_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [tenantId, orderId, amount, status || 'completed', 'sslcommerz', val_id]
      );
    } finally {
      client.release();
    }

    if (status === 'valid' || status === 'completed') {
      await publishEvent('payment.success', {
        tenantId,
        orderId,
        amount,
        gateway: 'sslcommerz',
        val_id,
        timestamp: new Date(),
      });
    } else {
      await publishEvent('payment.failed', { tenantId, orderId, amount, gateway: 'sslcommerz', val_id, status, timestamp: new Date() });
    }

    return c.json({ acknowledged: true });
  } catch (err) {
    log.error({ err: err.message }, 'Webhook processing failed');
    return c.json({ error: 'processing failed' }, 500);
  }
});

app.get('/payment/transactions', async (c) => {
  const { tenantId, limit = 50 } = c.req.query();
  if (!tenantId) return c.json({ error: 'tenantId required' }, 400);

  try {
    const { rows } = await pool.query(
      'SELECT * FROM payments WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2',
      [tenantId, Number(limit)]
    );
    return c.json({ count: rows.length, transactions: rows });
  } catch (err) {
    log.error({ err: err.message }, 'Failed to list transactions');
    return c.json({ error: 'failed to list transactions' }, 500);
  }
});

async function start() {
  await ensureSchema();
  serve(
    {
      fetch: app.fetch,
      port: PORT,
    },
    (info) => {
      log.info(`Payment service listening on port ${PORT}`);
    }
  );
}

start().catch((err) => {
  log.error({ err: err.message }, 'Failed to start payment service');
  process.exit(1);
});
