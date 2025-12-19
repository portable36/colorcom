# Shipping Service (lightweight)

This is a small shipping microservice used in the colorcom demo.

- Exposes a health endpoint: `GET /shipping/health`
- Exposes a mock shipment lookup: `GET /shipping/shipments/:orderId`
- Listens to Kafka topic `order.created` (configurable via `TOPIC` env var) and simulates creating a shipment.
 - Exposes a shipments listing endpoint: `GET /shipping/shipments` (optional `tenantId` and `limit` query params)
 - Exposes a mock shipment lookup: `GET /shipping/shipments/:orderId`
 - Listens to Kafka topic `order.created` (configurable via `TOPIC` env var) and simulates creating a shipment.

Environment variables:
- `PORT` (default: 3010)
- `KAFKA_BROKERS` (default: `kafka:9092`)
- `TOPIC` (default: `order.created`)

Run locally:
```
cd microservices/shipping-service
npm install
node index.js
```

Docker:
```
docker build -t colorcom-shipping ./microservices/shipping-service
docker run --env KAFKA_BROKERS=kafka:9092 -p 3010:3010 colorcom-shipping
```
