ColorCom is a complex microservices-based e-commerce platform. It utilizes a modern stack with Node.js (NestJS) for services, Kong for API Management, and a variety of backing services including Postgres, Redis, Elasticsearch, MongoDB, and Kafka.
# ColorCom — Local Development

This repository contains a domain-driven microservices example for an e-commerce platform (ColorCom).

Quick pointers:

- Start the full dev stack:

```bash
docker compose up -d --build
```

- Run the E2E smoke test:

```bash
bash scripts/e2e-local.sh
# or: npm run e2e:local
```

- Service docs & per-service Quickstarts are under `microservices/<service>/README.md`.

Microservices port:
- Auth Service: Port 3001
- Product Service: Port 3002
- Cart Service: Port 3004
- Order Service: Port 3005
- Shipping Service: Port 3010
- Others: Vendor, CMS, CSM, Inventory, Payment, Review.
Infrastructure port:
- Kong: 8000 (Proxy), 8001 (Admin)
- Postgres: 5432
- Redis: 6379
- Elasticsearch: 9200
- Kafka: 9092
- Mongo: 27017
- Prometheus/Grafana: 9090 / 3050
Technology Stack
- Framework: NestJS (TypeScript)
- Database: PostgreSQL (primary), MongoDB (CMS/Reviews)
- Caching: Redis
- Search: Elasticsearch
- Messaging: Kafka (Order processing)
- API Gateway: Kong (Declarative config in kong/kong.yml)
- Monitoring: Prometheus & Grafana


