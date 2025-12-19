# Inventory Service

NestJS microservice for stock management and reservation.

Listens to `order.created` events and reserves stock automatically.

Endpoints:
- `GET /inventory/health` — health check
- `POST /inventory/stock` — add stock (body: tenantId, productId, quantity)
- `GET /inventory/stock?tenantId=...` — list inventory
- `GET /inventory/stock/:productId?tenantId=...` — get item inventory

Env vars:
- `DATABASE_URL` — Postgres connection (default: `postgresql://colorcom:colorcom123@postgres:5432/colorcom_inventory`)
- `KAFKA_BROKERS` — Kafka brokers (default: `kafka:9092`)
- `PORT` — service port (default: 3008)

Run locally:
```
cd microservices/inventory-service
npm install
npm run build
npm start
```
