const express = require('express');
const mongoose = require('mongoose');
const pino = require('pino');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3006;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/colorcom_cms';

const pageSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  body: { type: String, required: true },
}, { timestamps: true });

const Page = mongoose.model('Page', pageSchema);

app.get('/cms/health', (req, res) => res.json({ status: 'ok' }));

app.post('/cms/pages', async (req, res) => {
  const { tenantId, title, slug, body } = req.body;
  if (!tenantId || !title || !slug || !body) return res.status(400).json({ error: 'missing fields' });
  try {
    const page = await Page.create({ tenantId, title, slug, body });
    res.status(201).json(page);
  } catch (err) {
    log.error({ err: err.message }, 'Failed to create page');
    res.status(500).json({ error: 'failed to create page' });
  }
});

app.get('/cms/pages', async (req, res) => {
  const { tenantId, limit = 50 } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
  const pages = await Page.find({ tenantId }).limit(Number(limit)).sort({ createdAt: -1 }).exec();
  res.json({ count: pages.length, pages });
});

app.get('/cms/pages/:slug', async (req, res) => {
  const { slug } = req.params;
  const { tenantId } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId query required' });
  const page = await Page.findOne({ tenantId, slug }).exec();
  if (!page) return res.status(404).json({ error: 'not found' });
  res.json(page);
});

async function start() {
  try {
    await mongoose.connect(MONGO_URL, { dbName: 'colorcom_cms' });
    log.info('Connected to MongoDB');
  } catch (err) {
    log.error({ err: err.message }, 'MongoDB connection failed');
  }
  app.listen(PORT, () => log.info({ port: PORT }, 'CMS service listening'));
}

start().catch((err) => {
  log.error({ err: err.message }, 'Failed to start CMS service');
  process.exit(1);
});
