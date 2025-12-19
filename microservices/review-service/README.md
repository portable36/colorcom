# Review Service

Review and rating microservice using Express and MongoDB.

Listens to `order.shipped` Kafka events to enable reviews for completed orders.

Endpoints:
- `GET /reviews/health` — health check
- `POST /reviews` — submit review (body: tenantId, productId, orderId, userId, rating, title, body)
- `GET /reviews/product/:productId?tenantId=...` — list reviews for product
- `GET /reviews/product/:productId/stats?tenantId=...` — get review stats (avg rating, distribution)
- `GET /reviews/order/:orderId?tenantId=...` — list reviews for order

Env vars:
- `MONGO_URL` (default: `mongodb://mongo:27017/colorcom_reviews`)
- `KAFKA_BROKERS` (default: `kafka:9092`)
- `PORT` (default: 3011)

Run locally:
```
cd microservices/review-service
npm install
npm start
```

Test:
```bash
curl -X POST http://localhost:3011/reviews \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId":"default",
    "productId":"cmja0y4vw0003wkvmt10dpys6",
    "orderId":"order-123",
    "userId":"user-456",
    "rating":5,
    "title":"Excellent!",
    "body":"Great product, highly recommended."
  }'
```
