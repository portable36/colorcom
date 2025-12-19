# CMS Service

Lightweight CMS service storing pages in MongoDB.

Endpoints:
- `GET /cms/health` — health check
- `POST /cms/pages` — create page (body: tenantId, title, slug, body)
- `GET /cms/pages?tenantId=...` — list pages
- `GET /cms/pages/:slug?tenantId=...` — get page by slug

Env vars:
- `MONGO_URL` (default: `mongodb://mongo:27017/colorcom_cms`)
- `PORT` (default: 3006)

Run locally:
```
cd microservices/cms-service
npm install
node index.js
```
