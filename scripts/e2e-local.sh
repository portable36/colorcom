#!/usr/bin/env bash
set -euo pipefail

NO_TEARDOWN=0
NO_COMPOSE=0
TIMEOUT=60

usage() {
  cat <<EOF
Usage: $0 [--no-teardown] [--no-compose] [--timeout SECONDS]

Options:
  --no-teardown    Do not run 'docker compose down' at the end
  --no-compose     Do not run 'docker compose up'; assume stack is already running
  --timeout SECONDS Max seconds to wait for shipment (default: 60)
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-teardown) NO_TEARDOWN=1; shift ;;
    --no-compose) NO_COMPOSE=1; shift ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

cleanup() {
  if [[ "$NO_TEARDOWN" -eq 0 && "$NO_COMPOSE" -eq 0 ]]; then
    echo "Tearing down docker compose stack..."
    docker compose down -v --remove-orphans || true
  fi
}
trap cleanup EXIT

if [[ "$NO_COMPOSE" -eq 0 ]]; then
  echo "Bringing up docker compose stack..."
  docker compose up -d --build
fi

echo "Waiting for Shipping service health (http://localhost:3010/shipping/health)..."
for i in $(seq 1 60); do
  if curl -sS http://localhost:3010/shipping/health >/dev/null 2>&1; then
    echo "Shipping service is healthy"
    break
  fi
  echo -n '.'
  sleep 2
done

echo "Applying Prisma schema inside shipping container (if available)"
docker compose exec -T colorcom-shipping sh -c "npx prisma db push --accept-data-loss" || true

echo "Posting a test order to Order service..."
ORDER_RESP=$(curl -s -X POST http://localhost:3005/orders \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -H 'x-user-id: e2e-user-1' \
  -d '{"cartItems":[{"productId":"cmja0y4vw0003wkvmt10dpys6","vendorId":"vendor-1","name":"E2E Product","price":10,"quantity":1}],"shippingAddress":{"street":"1 E2E St","city":"E2E","state":"E2","zipCode":"00000","country":"E2"}}' )

echo "Order response: $ORDER_RESP"

# Extract order id using jq if available, else basic grep
ORDER_ID=""
# Use jq if available; accept either top-level id or nested orderId
if command -v jq >/dev/null 2>&1; then
  ORDER_ID=$(echo "$ORDER_RESP" | jq -r '.id // .orderId // empty') || true
else
  ORDER_ID=$(echo "$ORDER_RESP" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]\+\)".*/\1/p' || true)
fi

if [[ -z "$ORDER_ID" ]]; then
  echo "Failed to find order id in response; raw response:" && echo "$ORDER_RESP"
  exit 2
fi

echo "Order ID: $ORDER_ID"

echo "Waiting up to ${TIMEOUT}s for shipment to appear via shipping endpoint..."
ELAPSED=0
INTERVAL=2
FOUND=0
while [[ $ELAPSED -lt $TIMEOUT ]]; do
  if command -v jq >/dev/null 2>&1; then
    if curl -s "http://localhost:3010/shipping/shipments?tenantId=default&limit=50" | jq -e --arg id "$ORDER_ID" '.shipments[] | select(.orderId == $id)' >/dev/null 2>&1; then
      FOUND=1
      break
    fi
  else
    # fallback: simple grep
    if curl -s "http://localhost:3010/shipping/shipments?tenantId=default&limit=50" | grep -q "$ORDER_ID"; then
      FOUND=1
      break
    fi
  fi
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [[ $FOUND -eq 1 ]]; then
  echo "Shipment found for order $ORDER_ID"
  # show recent shipping logs
  docker compose logs --no-color --tail 200 colorcom-shipping || true
  exit 0
else
  echo "Timed out waiting for shipment for order $ORDER_ID"
  docker compose logs --no-color --tail 200 colorcom-shipping || true
  exit 3
fi
