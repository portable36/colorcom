# Kong API Gateway — ColorCom Multi-Vendor Platform

This is the **PHASE 1** Kong API Gateway configuration for the ColorCom microservices architecture.

## What Kong Does

Kong is the **single entry point** for all frontend requests. It:
- ✅ Routes requests to appropriate microservices
- ✅ Enforces rate limiting (100 req/min per client)
- ✅ Adds correlation IDs for distributed tracing
- ✅ Handles CORS for Next.js frontend
- ✅ Validates API keys / JWT tokens (when configured)
- ✅ Collects Prometheus metrics
- ✅ Terminates TLS/HTTPS (in production)

## Architecture

```
Next.js PWA (http://localhost:3000)
         ↓
    Kong Gateway (http://localhost:8000)
         ↓
    ┌────────────────────────────────┐
    ├─ Auth Service    (port 3001)   │
    ├─ Product Service (port 3002)   │
    ├─ Vendor Service  (port 3003)   │
    ├─ Cart Service    (port 3004)   │
    └─ Order Service   (port 3005)   │
         ↓
    ┌─────────────────────────────────┐
    ├─ PostgreSQL (port 5432)         │
    ├─ Redis      (port 6379)         │
    ├─ Elasticsearch (port 9200)      │
    ├─ Kafka      (port 9092)         │
    └─ Prometheus (port 9090)         │
```

## Files Included

- `kong.yml` — Kong declarative config (services, routes, plugins)
- `docker-compose.yml` — Full stack: Kong + 5 services + databases + observability
- `init-postgres.sh` — PostgreSQL setup script (creates 5 databases)
- `prometheus.yml` — Prometheus scrape config for metrics

## Quick Start

### 1. Start Everything

```bash
docker-compose up -d
```

This starts:
- Kong (proxy on :8000, admin on :8001)
- Auth Service (port 3001)
- Product Service (port 3002)
- Vendor Service (port 3003)
- Cart Service (port 3004)
- Order Service (port 3005)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Elasticsearch (port 9200)
- Kafka + Zookeeper (port 9092)
- Prometheus (port 9090)
- Grafana (port 3050)

### 2. Verify Kong is Running

```bash
# Health check
curl http://localhost:8001

# Check configured services
curl http://localhost:8001/services
```

### 3. Test API Routes

```bash
# Auth service (through Kong)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# List products
curl http://localhost:8000/products

# List vendors
curl http://localhost:8000/vendors
```

### 4. Frontend Connection

Update `nextjs-pwa/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then run:

```bash
cd nextjs-pwa
npm install
npm run dev
```

Frontend is available at `http://localhost:3000` and talks to Kong at `http://localhost:8000`.

## Kong Plugins Enabled

| Plugin | Purpose |
|--------|---------|
| `cors` | Allow Next.js frontend requests |
| `rate-limiting` | 100 requests/minute (configurable) |
| `request-id` | Add `x-correlation-id` for tracing |
| `request-transformer` | Inject gateway metadata |
| `response-transformer` | Add gateway version header |
| `prometheus` | Expose `/metrics` for Prometheus |
| `request-size-limiting` | Prevent large payloads (10 MB) |
| `key-auth` | API key authentication (optional) |

## Kong Admin API

Kong Admin API is available at `http://localhost:8001`. You can:
- Add/remove services and routes
- Configure plugins per route
- View service health
- Manage consumers and credentials

Examples:

```bash
# Get all services
curl http://localhost:8001/services

# Get all routes
curl http://localhost:8001/routes

# Get Kong version
curl http://localhost:8001/

# Reload configuration
curl -X POST http://localhost:8001/config
```

## Observability

### Prometheus (http://localhost:9090)
Scrapes metrics from Kong, PostgreSQL, Redis, Elasticsearch, Kafka.

### Grafana (http://localhost:3050)
- Default login: `admin` / `admin`
- Connect Prometheus as data source
- Create dashboards for Kong metrics

### Correlation IDs
Every request gets a unique `x-correlation-id` header for end-to-end tracing.

## Next Steps

After Kong is running:

**STEP 1:** Build Auth Service (NestJS, JWT, OAuth2, Prisma, PostgreSQL)
- Login/logout/refresh endpoints
- Reusable JWT guard + Tenant guard
- Password hashing (bcrypt)
- Multi-tenant support

**STEP 2:** Build Product Service (NestJS, PostgreSQL, Elasticsearch)
- CRUD endpoints
- Elasticsearch indexing for search
- Tenant-aware queries

**STEP 3:** Build Vendor Service (NestJS, PostgreSQL)
- Vendor management
- CMS for vendor content

**STEP 4:** Build Cart Service (NestJS, Redis)
- Ultra-fast cart operations
- Session management

**STEP 5:** Build Order Service (NestJS, PostgreSQL, Kafka)
- Order creation
- Payment webhook handling
- Event publishing to Kafka

## Environment Variables

Kong and services read from environment. Key ones:

```bash
# Kong
KONG_DATABASE=off
KONG_DECLARATIVE_CONFIG=/kong/kong.yml
KONG_PROXY_LISTEN=0.0.0.0:8000
KONG_ADMIN_LISTEN=0.0.0.0:8001

# Services
JWT_SECRET=your-super-secret-jwt-key-change-in-prod
DB_HOST=postgres
DB_USER=colorcom
DB_PASSWORD=colorcom123
REDIS_URL=redis://redis:6379
ELASTICSEARCH_URL=http://elasticsearch:9200
KAFKA_BROKERS=kafka:9092
```

## Troubleshooting

### Kong not starting?
```bash
docker-compose logs kong
```

### Services not reachable?
```bash
# Check if services are healthy
docker-compose ps

# Check Kong's service configuration
curl http://localhost:8001/services
```

### PostgreSQL connection error?
```bash
# Check Postgres logs
docker-compose logs postgres

# Access Postgres directly
docker exec -it colorcom-postgres psql -U colorcom -l
```

### Rate limit not working?
Ensure Redis is running and Kong can connect to it. Update `kong.yml` rate-limiting policy to use Redis if needed.

## Production Considerations

1. **TLS/HTTPS** — Add SSL certificate to Kong, update Proxy listen to `:8443`
2. **Database** — Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
3. **Redis** — Use managed Redis (AWS ElastiCache, Google Cloud Memorystore)
4. **Elasticsearch** — Use Elasticsearch Service or OpenSearch
5. **Kafka** — Use managed Kafka (Confluent Cloud, AWS MSK)
6. **Kong** — Deploy Kong in HA mode with multiple replicas
7. **Monitoring** — Add Sentry for error tracking, OpenTelemetry for tracing
8. **Secrets** — Store JWT_SECRET and DB_PASSWORD in environment secrets (not in code)

## More Info

- [Kong Documentation](https://docs.konghq.com)
- [Kong Plugins](https://docs.konghq.com/hub/)
- [Kong Declarative Config](https://docs.konghq.com/gateway/latest/reference/declarative-config/)
