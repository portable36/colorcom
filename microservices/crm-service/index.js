const express = require('express');
const pino = require('pino');
const { Pool } = require('pg');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3007;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://colorcom:colorcom123@postgres:5432/colorcom_crm';

const pool = new Pool({ connectionString: DATABASE_URL });

async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(100) NOT NULL,
        name TEXT NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `);
  } finally {
    client.release();
  }
}

app.get('/crm/health', (req, res) => res.json({ status: 'ok' }));

app.post('/crm/customers', async (req, res) => {
  const { tenantId, name, email } = req.body;
  if (!tenantId || !name || !email) return res.status(400).json({ error: 'missing fields' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO customers (tenant_id, name, email) VALUES ($1, $2, $3) RETURNING *',
      [tenantId, name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    log.error({ err: err.message }, 'Failed to insert customer');
    res.status(500).json({ error: 'failed to create customer' });
  }
});

app.get('/crm/customers', async (req, res) => {
  const { tenantId, limit = 50 } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2', [tenantId, Number(limit)]);
    res.json({ count: rows.length, customers: rows });
  } catch (err) {
    log.error({ err: err.message }, 'Failed to list customers');
    res.status(500).json({ error: 'failed to list customers' });
  }
});

async function start() {
  await ensureSchema();
  app.listen(PORT, () => log.info({ port: PORT }, 'CRM service listening'));
}

start().catch((err) => {
  log.error({ err: err.message }, 'Failed to start CRM service');
  process.exit(1);
});
