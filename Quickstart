🟢 PHASE 0 — SYSTEM ARCHITECTURE (Understand First)
High-Level Architecture Diagram:

[ Next.js PWA ]
       |
       v
[ Kong API Gateway ]
       |
 ┌───────────────┐
 | Auth Service  | ← OAuth2 / OIDC / JWT
 └───────────────┘
       |
 ┌──────────┬──────────┬──────────┐
 | User     | Product  | Order    |
 | Service  | Service  | Service  |
 └──────────┴──────────┴──────────┘
       |
 ┌───────────── Event Bus ─────────────┐
 | Kafka / RabbitMQ                     |
 └─────────────────────────────────────┘


🟢 PHASE 1 — API GATEWAY (KONG) 🔥

Why first?
Everything will go through Kong.

Responsibilities

TLS termination (HTTPS)

Rate limiting

JWT validation

OAuth2

API versioning

Tenant injection

Observability hooks

1️⃣ Install Kong (Docker)

# docker-compose.yml
version: "3.9"

services:
  kong:
    image: kong:3.6
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
    volumes:
      - ./kong.yml:/kong/kong.yml
    ports:
      - "8000:8000"
      - "8001:8001"

2️⃣ Kong Declarative Config (kong.yml)

services:
  - name: auth-service
    url: http://auth-service:3000
    routes:
      - name: auth-route
        paths:
          - /auth

plugins:
  - name: rate-limiting
    config:
      minute: 100
      policy: redis


👉 Kong will later:

Validate JWT

Inject x-tenant-id

Block unauth requests

🟢 PHASE 2 — AUTH SERVICE (MOST IMPORTANT)
Tech

NestJS

PostgreSQL

JWT

OAuth2 / OIDC

Multi-Tenant

1️⃣ Create Auth Service


nest new auth-service
cd auth-service
npm install @nestjs/jwt passport passport-jwt
npm install prisma @prisma/client


2️⃣ Clean Architecture Structure

src/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── value-objects/
├── application/
│   ├── use-cases/
│   └── dto/
├── infrastructure/
│   ├── prisma/
│   ├── controllers/
│   ├── guards/
│   └── strategies/
└── main.ts

3️⃣ JWT Strategy (Reusable Guard)

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: any) {
    return payload;
  }
}

👉 This guard will be shared across all services

4️⃣ Multi-Tenant Injection

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.tenantId = req.headers["x-tenant-id"];
    return true;
  }
}
👉 This guard extracts x-tenant-id from headers and attaches it to the request object for later use in services.

🟢 PHASE 3 — USER SERVICE

Responsibilities

User profile

Address

Roles

SSO mapping

Database

PostgreSQL

Security

JWT validated at Kong

Guarded inside service

🟢 PHASE 4 — PRODUCT SERVICE + SEARCH
Tech

NestJS

PostgreSQL

Elasticsearch

Flow

Create Product → Save PostgreSQL → Index Elasticsearch

Elasticsearch Mapping

{
  "name": "text",
  "price": "double",
  "category": "keyword",
  "tenantId": "keyword"
}
👉 All searches filter by tenantId to ensure multi-tenancy data isolation.

🟢 PHASE 5 — CART SERVICE (REDIS ⚡)
Why Redis?

Sub-millisecond

Stateless frontend

Massive scale

Key Pattern
class

cart:{tenantId}:{userId}

ts
// Add item to cart
await redis.hset(`cart:${tenant}:${user}`, productId, qty);

👉 Each user's cart is stored as a hash in Redis, allowing for quick access and updates.

🟢 PHASE 6 — ORDER / PAYMENT SERVICE
Payment Gateways

bkash

SSLCommerz

Architecture

Frontend → Order Service
Payment Webhook → Hono.js
Event → Kafka

Hono Webhook (Fast & Lightweight)

app.post("/webhook/bkash", async (c) => {
  const payload = await c.req.json();
  publishEvent("payment.success", payload);
});

🟢 PHASE 7 — SHIPPING SERVICE
Couriers

Steadfast

Pathao

Flow
Order Created → Shipping Service → Courier API

🟢 PHASE 8 — CMS + CRM
CMS (MongoDB)

Pages

Banners

Blogs

SEO metadata

CRM

Customer history

Orders

Reviews

Ratings

🟢 PHASE 9 — EVENT BUS (Kafka / RabbitMQ)
Events

user.created

order.created

payment.success

inventory.updated

Why?

Loose coupling

Scalability

Reliability

🟢 PHASE 10 — OBSERVABILITY & SECURITY
Monitoring

OpenTelemetry

Prometheus

Grafana

Sentry

Security

HTTPS everywhere

JWT short-lived

Refresh tokens

Rate limit (Kong)

IP whitelist for webhooks

Amazon-Grade Features

| Feature        | Tool         |
| -------------- | ------------ |
| TLS            | Kong         |
| Rate Limit     | Kong + Redis |
| Auth           | JWT / OAuth  |
| Canary Deploy  | Kong         |
| Tenant Routing | Header-based |

| Monitoring     | Prometheus   |
| Tracing        | OpenTelemetry|
| Error Tracking | Sentry       |

Kong Plugins You MUST Enable
- jwt
- oauth2
- rate-limiting
- request-transformer
- correlation-id
- prometheus

🟢 PHASE 3 — DOMAIN-DRIVEN MICROSERVICES

Core Services (Amazon-like)

| Service   | DB            | Purpose      |
| --------- | ------------- | ------------ |
| Identity  | PostgreSQL    | Users, roles |
| Catalog   | PostgreSQL    | Products     |
| Search    | Elasticsearch | Fast search  |
| Cart      | Redis         | Ultra-fast   |
| Order     | PostgreSQL    | Orders       |
| Payment   | PostgreSQL    | Payments     |
| Inventory | PostgreSQL    | Stock        |
| Shipping  | API           | Couriers     |
| CMS       | MongoDB       | Content      |
| Review    | MongoDB       | Ratings      |
| CRM       | PostgreSQL    | Customer mgmt|
| Event Bus | Kafka/RabbitMQ| Events       |

❌ Amazon Rule:

Never share databases between services

🟢 PHASE 4 — EVENT-DRIVEN (AMAZON’S SECRET WEAPON)

Amazon uses events everywhere.

Kafka Topics

user.created
product.created
cart.checkedout
order.created
payment.success
inventory.reserved
order.shipped

Why?

Scale independently

Recover from failure

Retry automatically

🟢 PHASE 5 — DATA CONSISTENCY (SAGA PATTERN)

Amazon never uses distributed transactions.

Order Saga

Create Order
 → Reserve Inventory
 → Process Payment
 → Confirm Order

If payment fails:

→ Release Inventory
→ Cancel Order

🟢 PHASE 6 — ULTRA PERFORMANCE (AMAZON SPEED)
Caching Strategy

| Layer   | Tool     |
| ------- | -------- |
| Browser | CDN      |
| API     | Kong     |
| App     | Redis    |
| DB      | Indexing |

🟢 PHASE 7 — SEARCH LIKE AMAZON
Elasticsearch Features

Autocomplete

Fuzzy search

Ranking

Tenant filter

🟢 PHASE 8 — SECURITY (AMAZON-GRADE)
Mandatory

HTTPS everywhere

mTLS (internal services)

JWT verification at Gateway

Rate limit per user

IP whitelist for webhooks

Zero-Trust Rule

Internal services trust no one

🟢 PHASE 9 — OBSERVABILITY (AMAZON DNA)
Tools

OpenTelemetry

Prometheus

Grafana

Jaeger

Sentry

