# Playwright E2E (Smoke)

Run a quick smoke test that exercises product browse → add to cart → checkout.

Steps:

1. Ensure Docker is running and the repo's services are available.
2. From repo root run:

```bash
scripts/e2e-playwright.sh
```

Notes:
- The script will start backend, apply Prisma schemas, start the frontend dev server, run Playwright tests headless, and stop the frontend.
- Playwright is installed inside `e2e/` dir; CI should `npm ci` and run `npx playwright test`.
