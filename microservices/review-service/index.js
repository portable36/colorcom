const express = require('express');
const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');
const pino = require('pino');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3011;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/colorcom_reviews';
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');

const reviewSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String },
  body: { type: String },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

app.get('/reviews/health', (req, res) => res.json({ status: 'ok' }));

app.post('/reviews', async (req, res) => {
  const { tenantId, productId, orderId, userId, rating, title, body } = req.body;
  if (!tenantId || !productId || !orderId || !userId || !rating) {
    return res.status(400).json({ error: 'missing required fields' });
  }
  try {
    const review = await Review.create({ tenantId, productId, orderId, userId, rating, title, body, verified: false });
    res.status(201).json(review);
  } catch (err) {
    log.error({ err: err.message }, 'Failed to create review');
    res.status(500).json({ error: 'failed to create review' });
  }
});

app.get('/reviews/product/:productId', async (req, res) => {
  const { productId } = req.params;
  const { tenantId, limit = 50 } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
  const reviews = await Review.find({ tenantId, productId }).limit(Number(limit)).sort({ createdAt: -1 }).exec();
  res.json({ count: reviews.length, reviews });
});

app.get('/reviews/product/:productId/stats', async (req, res) => {
  const { productId } = req.params;
  const { tenantId } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
  
  const reviews = await Review.find({ tenantId, productId }).exec();
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2) : 0;
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    ratingDistribution[r.rating]++;
  });
  
  res.json({ totalReviews, avgRating, ratingDistribution });
});

app.get('/reviews/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { tenantId } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
  const reviews = await Review.find({ tenantId, orderId }).exec();
  res.json({ count: reviews.length, reviews });
});

async function startKafkaConsumer() {
  try {
    const kafka = new Kafka({ brokers: KAFKA_BROKERS, clientId: 'review-service' });
    const consumer = kafka.consumer({ groupId: 'review-service' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'order.shipped', fromBeginning: false });
    log.info('Kafka consumer subscribed to order.shipped');

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = message.value ? message.value.toString() : '{}';
          const data = JSON.parse(payload);
          log.info(`Received order.shipped event for order ${data.orderId}`);
          // Order is ready for review; no action needed here, client will POST /reviews
        } catch (err) {
          log.error(`Failed to process order.shipped event: ${err.message}`);
        }
      },
    });
  } catch (err) {
    log.error(`Kafka consumer error: ${err.message}`);
  }
}

async function start() {
  try {
    await mongoose.connect(MONGO_URL, { dbName: 'colorcom_reviews' });
    log.info('Connected to MongoDB');
  } catch (err) {
    log.error({ err: err.message }, 'MongoDB connection failed');
  }
  
  startKafkaConsumer();
  
  app.listen(PORT, () => log.info({ port: PORT }, 'Review service listening'));
}

start().catch((err) => {
  log.error({ err: err.message }, 'Failed to start review service');
  process.exit(1);
});
