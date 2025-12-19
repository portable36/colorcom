# Payment Service

Lightweight payment webhook handler using Hono. Receives payment callbacks from bkash, SSLCommerz, etc., stores them in Postgres, and publishes `payment.success` events to Kafka.

Endpoints:
- `GET /payment/health` — health check
- `POST /payment/webhook/bkash` — bkash payment callback (body: tenantId, orderId, amount, trxID, status)
- `POST /payment/webhook/sslcommerz` — SSLCommerz payment callback (body: tenantId, orderId, amount, val_id, status)
- `GET /payment/transactions?tenantId=...` — list payment transactions

Env vars:
- `DATABASE_URL` — Postgres (default: `postgresql://colorcom:colorcom123@postgres:5432/colorcom_payments`)
- `KAFKA_BROKERS` — Kafka brokers (default: `kafka:9092`)
- `PORT` — service port (default: 3009)

Run locally:
```
cd microservices/payment-service
npm install
npm start
```

Test webhook:
```bash
curl -X POST http://localhost:3009/payment/webhook/bkash \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":"default","orderId":"order123","amount":500,"trxID":"trx-001","status":"completed"}'
```
