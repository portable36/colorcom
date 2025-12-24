# Colorcom Web Frontend

Minimal Next.js + TypeScript + Tailwind storefront skeleton.

## Local development

1. Start backend services:

```bash
# From repo root
docker compose up -d
```

2. Ensure Prisma schemas are applied where needed (order, inventory, shipping):

```bash
docker compose exec -T order-service npx prisma db push --accept-data-loss
docker compose exec -T inventory-service npx prisma db push --accept-data-loss
docker compose exec -T shipping-service npx prisma db push --accept-data-loss
```

3. Start frontend:

```bash
cd microservices/web-frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Notes
- The frontend expects product service at `NEXT_PUBLIC_PRODUCT_SERVICE_URL` (defaults to `http://localhost:3002`) and order service at `NEXT_PUBLIC_ORDER_SERVICE_URL` (defaults to `http://localhost:3005`).
- This is an MVP skeleton; next steps: cart state, checkout integration, auth. The cart and a basic checkout flow are implemented in-memory and POST to `order-service`.

## How to contribute
- Use the `CHECKLIST.md` before opening a PR to run E2E locally and add screenshots if making UI changes.
- Keep PRs small; add Playwright tests for any UI flows that change.
- See `CONTRIBUTING.md` for more info.
