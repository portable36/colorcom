#!/usr/bin/env bash
set -euo pipefail

echo "Starting backend services..."
docker compose up -d

echo "Ensure prisma schemas are applied (order, inventory, shipping)"
docker compose exec -T order-service npx prisma db push --accept-data-loss || true
docker compose exec -T inventory-service npx prisma db push --accept-data-loss || true
docker compose exec -T shipping-service npx prisma db push --accept-data-loss || true

cd microservices/web-frontend
npm install
npm run dev
