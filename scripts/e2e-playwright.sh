#!/usr/bin/env bash
set -euo pipefail

echo "Starting backend services..."
docker compose up -d

echo "Ensure prisma schemas are applied (order, inventory, shipping)"
docker compose exec -T order-service npx prisma db push --accept-data-loss || true
docker compose exec -T inventory-service npx prisma db push --accept-data-loss || true
docker compose exec -T shipping-service npx prisma db push --accept-data-loss || true

echo "Starting frontend dev server..."
pushd microservices/web-frontend >/dev/null
npm ci
npm run dev &
FRONTEND_PID=$!
popd >/dev/null

# wait for frontend
for i in $(seq 1 60); do
  if curl -sSf http://localhost:3000 >/dev/null 2>&1; then
    echo "Frontend up"
    break
  fi
  sleep 1
done

echo "Running Playwright tests..."
pushd e2e >/dev/null
npm ci
npx playwright test --config=./playwright.config.ts || TEST_EXIT=$?
popd >/dev/null

echo "Stopping frontend"
kill ${FRONTEND_PID} >/dev/null 2>&1 || true

exit ${TEST_EXIT:-0}
