# Inventory Service - Advanced Features

This inventory service now includes:

- **Multi-warehouse support** — manage stock across multiple warehouses per tenant
- **Stock level tracking** — separate available, reserved, and damaged quantities
- **Reservations during checkout** — reserve stock when order is created, confirm on payment, release on failure
- **Low stock alerts** — automatic alerts when stock falls below reorder level
- **Event-driven sync** — publishes inventory events to Kafka (reserved, released, confirmed, etc.)

## API Endpoints

### Warehouse Management

```bash
# Create warehouse
curl -X POST http://localhost:3001/inventory/warehouses \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -d '{"name":"Main Warehouse","location":"NYC"}'

# List warehouses
curl http://localhost:3001/inventory/warehouses \
  -H 'x-tenant-id: default'

# Get warehouse details
curl http://localhost:3001/inventory/warehouses/{warehouseId} \
  -H 'x-tenant-id: default'

# Update warehouse
curl -X PUT http://localhost:3001/inventory/warehouses/{warehouseId} \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -d '{"location":"Boston"}'

# Delete warehouse
curl -X DELETE http://localhost:3001/inventory/warehouses/{warehouseId} \
  -H 'x-tenant-id: default'
```

### Stock Level Management

```bash
# Get stock level for product (across all warehouses or specific)
curl 'http://localhost:3001/inventory/stock/levels/prod-123' \
  -H 'x-tenant-id: default'

curl 'http://localhost:3001/inventory/stock/levels/prod-123?warehouseId=wh-1' \
  -H 'x-tenant-id: default'

# Update stock (add/remove quantity)
curl -X POST http://localhost:3001/inventory/stock/update \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -d '{
    "productId": "prod-123",
    "warehouseId": "wh-1",
    "deltaQuantity": 100
  }'

# Mark units as damaged
curl -X POST http://localhost:3001/inventory/stock/damage \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -d '{
    "productId": "prod-123",
    "warehouseId": "wh-1",
    "quantity": 5
  }'

# Transfer stock between warehouses
curl -X POST http://localhost:3001/inventory/stock/transfer \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -d '{
    "productId": "prod-123",
    "fromWarehouseId": "wh-1",
    "toWarehouseId": "wh-2",
    "quantity": 50
  }'
```

### Reservations (Checkout Flow)

```bash
# Reserve stock for an order (checkout)
curl -X POST http://localhost:3001/inventory/reservations/reserve \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -d '{
    "warehouseId": "wh-1",
    "orderId": "order-456",
    "items": [
      {"productId": "prod-123", "quantity": 2},
      {"productId": "prod-456", "quantity": 1}
    ]
  }'

# Release reservation (payment failed / order cancelled)
curl -X POST http://localhost:3001/inventory/reservations/release \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -d '{
    "orderId": "order-456",
    "items": [
      {"productId": "prod-123", "quantity": 2, "warehouseId": "wh-1"},
      {"productId": "prod-456", "quantity": 1, "warehouseId": "wh-1"}
    ]
  }'

# Confirm reservation (payment success)
curl -X POST http://localhost:3001/inventory/reservations/confirm \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: default' \
  -d '{
    "orderId": "order-456",
    "items": [
      {"productId": "prod-123", "quantity": 2, "warehouseId": "wh-1"},
      {"productId": "prod-456", "quantity": 1, "warehouseId": "wh-1"}
    ]
  }'
```

## Stock Levels Explained

For each product in a warehouse:

- **quantity**: Total units (available + reserved + damaged)
- **available**: Can be sold (quantity - reserved - damaged)
- **reserved**: Reserved during checkout, pending confirmation
- **damaged**: Units marked as defective

### Checkout Flow

1. **Create Order** → `inventory.reserved` event
   - User adds items to cart and checks out
   - `POST /inventory/reservations/reserve` → marks items as reserved
   
2. **Payment Success** → `inventory.confirmed` event
   - `POST /inventory/reservations/confirm` → moves reserved to finalized (decrement quantity)
   
3. **Payment Failure / Cancel** → `inventory.released` event
   - `POST /inventory/reservations/release` → frees reserved stock back to available

## Events Published

All events are published to Kafka topics:

- `inventory.stock_updated` — stock changed in warehouse
- `inventory.reserved` — stock reserved for an order
- `inventory.released` — reservation released
- `inventory.confirmed` — reservation confirmed (finalized)
- `inventory.units_damaged` — units marked as damaged
- `inventory.transfer_completed` — stock transferred between warehouses
- `inventory.low_stock` — low stock alert (below reorder level)
- `inventory.out_of_stock` — out of stock alert

## Database Schema

### Warehouse
```
id, tenantId, name, location, isActive, createdAt, updatedAt
```

### WarehouseStock
```
id, warehouseId, tenantId, productId
available, reserved, damaged, quantity, reorderLevel
createdAt, updatedAt
```

### StockAlert
```
id, tenantId, productId, warehouseId
alertType (LOW_STOCK, OUT_OF_STOCK, OVERSTOCK)
severity (info, warning, critical)
message, isResolved, resolvedAt
createdAt, updatedAt
```

## Example Workflow

```typescript
// 1. Create warehouse
POST /inventory/warehouses → { id: 'wh-1', name: 'Main', ... }

// 2. Add stock for products
POST /inventory/stock/update → { productId: 'p1', warehouseId: 'wh-1', deltaQuantity: 100 }

// 3. Get stock level
GET /inventory/stock/levels/p1 → { available: 100, reserved: 0, damaged: 0, quantity: 100 }

// 4. Reserve during checkout (order created)
POST /inventory/reservations/reserve → { orderId: 'o1', items: [{productId: 'p1', quantity: 2}], warehouseId: 'wh-1' }
// Stock now: available: 98, reserved: 2, quantity: 100

// 5a. Payment success → confirm
POST /inventory/reservations/confirm → { orderId: 'o1', items: [...] }
// Stock now: available: 98, reserved: 0, quantity: 98

// 5b. Payment failed → release
POST /inventory/reservations/release → { orderId: 'o1', items: [...] }
// Stock back to: available: 100, reserved: 0, quantity: 100
```
