# Quickstart

> Minimal, up-to-date quickstart for developers — start the local dev stack, run an E2E smoke test, and learn where to find per-service run/migration instructions.

---

## Getting started (short) ✅

**Prerequisites:** Docker & Docker Compose (v2+), Node.js (for service-level commands)

1) Start the whole stack (development):

```bash
# from repository root
docker compose up -d --build
```

This starts Kong (proxy on port **8000** / admin on **8001**), Postgres (**5432**), Redis (**6379**), Elasticsearch (**9200**), Kafka, and the microservices. Key service ports used by this Compose file (host → container):

- Kong proxy: **8000** (HTTP), **8443** (HTTPS if configured)
- Kong admin: **8001**
- Auth service: **3001** (proxied at `/auth` via Kong)
- Product service: **3002** (proxied at `/products`)
- Cart service: **3004**
- Order service: **3005**
- Shipping service: **3010**
- Grafana: **3050**, Prometheus: **9090**

2) Run the built-in E2E smoke script:

```bash
# runs a small order → shipping end-to-end check
bash scripts/e2e-local.sh
# or: npm run e2e:local
```

3) Run a single service locally (example: auth):

```bash
cd microservices/auth-service
npm install
npm run dev
```

Kong routes (see `kong/kong.yml`) proxy requests, so a request to `http://localhost:8000/auth/login` will reach the auth service running in the stack at `auth-service:3001`.

---

## Migrations & DB 🔧

- Each service with Prisma has migrations under `microservices/<service>/prisma/migrations`.
- For local development, run migrations in the service dir:

```bash
cd microservices/auth-service
npx prisma migrate dev --name init
npx prisma generate
```

- The e2e script may use `npx prisma db push` for quick schema application.

---

## Secrets & envs 🔐

- Example `.env.example` files are included (see `microservices/auth-service/.env.example`).
- **Do not** keep production secrets in `docker-compose.yml` — use a secret manager, Docker secrets, or environment variables in deployment.
- Replace `JWT_SECRET` and DB passwords before deploying to production.

---

## Helpful files

- `docker-compose.yml` — full development stack
- `kong/kong.yml` — Kong declarative configuration
- `scripts/e2e-local.sh` — E2E smoke test (Order → Shipping flow)
- `microservices/*/README.md` — per-service quickstart & migration instructions

---

## Notes & suggested follow-ups

- This document aligns with the actual `docker-compose.yml` ports (e.g., `auth-service` on **3001**). Older copies referenced port 3000.
- Recommended next tasks: add `.env.example` for other services, pin Kong image in `docker-compose.yml`, and add a helper to run all Prisma migrations.

---

If you want, I can open a small PR adding a `docs/` folder and more `.env.example` files or create GitHub issues for the follow-ups.
