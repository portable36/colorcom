#!/usr/bin/env bash
set -euo pipefail

echo "Starting selected backend services (excludes prometheus/grafana to avoid host mount issues)..."
docker compose up -d postgres redis elasticsearch zookeeper kafka product-service order-service cart-service inventory-service shipping-service mongo

echo "Ensure prisma schemas are applied (order, inventory, shipping)"
# Provide DATABASE_URL explicitly when running prisma CLI inside service containers
docker compose exec -T order-service sh -lc 'DATABASE_URL="postgresql://colorcom:colorcom123@postgres:5432/colorcom_orders" npx prisma db push --accept-data-loss' || true
docker compose exec -T inventory-service sh -lc 'DATABASE_URL="postgresql://colorcom:colorcom123@postgres:5432/colorcom_inventory" npx prisma db push --accept-data-loss' || true
docker compose exec -T shipping-service sh -lc 'DATABASE_URL="postgresql://colorcom:colorcom123@postgres:5432/colorcom_shipments" npx prisma db push --accept-data-loss' || true

echo "Starting frontend dev server..."
pushd microservices/web-frontend >/dev/null
# Install dependencies without force-removing node_modules (native swc files can be stuck on some filesystems)
if [ -f package-lock.json ]; then
  echo "package-lock.json found: using npm ci"
  npm ci --silent || { echo "npm ci failed, falling back to npm install"; npm install --silent; }
else
  echo "package-lock.json not found: running npm install"
  npm install --silent || { echo "npm install failed"; exit 1; }
fi
# Build and run Next.js in production mode (safer & avoids dev-only file locks)
npm run build --silent
npm run start &
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
