# CRM Service

Simple CRM service storing customers in Postgres.

Endpoints:
- `GET /crm/health` — health check
- `POST /crm/customers` — create customer (body: tenantId, name, email)
- `GET /crm/customers?tenantId=...` — list customers

Env vars:
- `DATABASE_URL` (default: `postgresql://colorcom:colorcom123@postgres:5432/colorcom_crm`)
- `PORT` (default: 3007)

Run locally:
```
cd microservices/crm-service
npm install
node index.js
```
