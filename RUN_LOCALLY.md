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

Tips & troubleshooting:
- If Playwright cannot start browsers in CI, run `npx playwright install --with-deps` on the runner.
- If Playwright tests fail intermittently, increase timeouts in `e2e/playwright.config.ts` or add retries in CI.
- For DB issues, ensure the databases exist: `docker compose exec -T postgres psql -U colorcom -c "\l"` and run `npx prisma db push` in the affected service container.

Troubleshooting tips:
- Inspect logs: `docker compose logs --tail 200 <service>`
- If services fail to start, run `docker compose ps --all` and check exit codes.
