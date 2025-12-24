# Run Locally (quick checklist)

1. Start infra & services:

```bash
docker compose up -d
```

2. Apply Prisma schemas (if any service reports missing tables):

```bash
docker compose exec -T <service> npx prisma db push --accept-data-loss
```

3. Start frontend:

```bash
cd microservices/web-frontend
npm install
npm run dev
# open http://localhost:3000
```

4. Smoke test:
- Use `scripts/e2e-local.sh` to exercise order → inventory → shipping.
- Use the Playwright smoke test to verify end-to-end UI flow: `scripts/e2e-playwright.sh` (starts backend, frontend dev server and runs the UI smoke tests).

Troubleshooting tips:
- Inspect logs: `docker compose logs --tail 200 <service>`
- If services fail to start, run `docker compose ps --all` and check exit codes.
