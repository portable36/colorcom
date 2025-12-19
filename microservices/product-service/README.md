# Product Service - Additional Features

This service now includes:

- Batch import/export (CSV/JSON) via `/products/import` and `/products/export`.
- Webhook registration and delivery via `/webhooks` (register/list/remove).
- GraphQL API (Apollo) mounted by NestJS (see `/graphql` playground).
- Multi-language support via `ProductTranslation` Prisma model. Use `?lang=xx` query parameter.
- Simple recommendations endpoint: `GET /products/:id/recommendations`.
- Basic analytics: `GET /reports/products/summary`.

Quick commands:

```bash
# import JSON
PRODUCT_SERVICE_URL=http://localhost:3000 TENANT_ID=default node tools/product-import.js data/products.json

# export JSON
PRODUCT_SERVICE_URL=http://localhost:3000 TENANT_ID=default node tools/product-export.js products_out.json
```

Webhook example:

```bash
curl -X POST http://localhost:3000/webhooks/register -H 'Content-Type: application/json' -H 'x-tenant-id: default' -d '{"url":"http://example.com/hook","events":["product.created"]}'
```
# Product Service

Multi-vendor product catalog microservice with PostgreSQL persistence, Elasticsearch full-text search, and tenant-aware filtering.

## Features

✅ **Tenant-scoped product management** - Complete isolation per tenant/store  
✅ **Full-text search** - Elasticsearch-powered search with fuzzy matching  
✅ **Advanced filtering** - Category, price range, status, rating  
✅ **Inventory management** - Stock tracking and reservation  
✅ **Featured & trending** - Product promotion endpoints  
✅ **SEO fields** - Title, description, keywords, sitemap support  
✅ **Product variants** - Images, weights, dimensions, metadata  
✅ **Pagination & sorting** - Efficient data retrieval  
✅ **Autocomplete suggestions** - Real-time search suggestions  
✅ **Analytics** - Aggregations: category distribution, price stats  

## Architecture

```
src/
├── application/
│   └── services/
│       └── product.service.ts          # Business logic
├── domain/
│   └── dto/
│       ├── create-product.dto.ts       # Create validation
│       ├── update-product.dto.ts       # Update validation
│       └── search-products.dto.ts      # Search validation
├── infrastructure/
│   ├── controllers/
│   │   └── product.controller.ts       # HTTP endpoints
│   ├── database/
│   │   └── prisma.service.ts           # ORM service
│   └── search/
│       └── elasticsearch.service.ts    # Full-text search
├── app.module.ts                       # Root module
└── main.ts                             # Entry point
prisma/
└── schema.prisma                       # Database schema
```

## Database Schema

### Products Table

```sql
CREATE TABLE "Product" (
  id              STRING PRIMARY KEY,
  tenantId        STRING NOT NULL,      -- Multi-tenant isolation
  sku             STRING NOT NULL,      -- Unique per tenant
  name            STRING NOT NULL,
  description     STRING NOT NULL,
  longDescription STRING,
  category        STRING NOT NULL,
  subCategory     STRING,
  tags            STRING[] DEFAULT {},
  price           FLOAT NOT NULL,
  costPrice       FLOAT,
  discountPrice   FLOAT,
  discountPercent FLOAT,
  stock           INT DEFAULT 0,
  reserved        INT DEFAULT 0,
  weight          FLOAT,
  dimensions      JSON,
  images          STRING[] DEFAULT {},
  thumbnail       STRING,
  seoTitle        STRING,
  seoDescription  STRING,
  seoKeywords     STRING,
  rating          FLOAT DEFAULT 0,
  reviewCount     INT DEFAULT 0,
  status          ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED'),
  featured        BOOLEAN DEFAULT false,
  trending        BOOLEAN DEFAULT false,
  metadata        JSON,
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  UNIQUE(tenantId, sku),
  INDEX(tenantId),
  INDEX(category),
  INDEX(status),
  INDEX(createdAt)
);
```

### Elasticsearch Mapping

Each tenant has a separate Elasticsearch index: `products_{tenantId}`

```json
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "default": {
          "type": "standard",
          "stopwords": "_english_"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "tenantId": { "type": "keyword" },
      "sku": { "type": "keyword" },
      "name": { "type": "text", "analyzer": "standard" },
      "description": { "type": "text", "analyzer": "standard" },
      "category": { "type": "keyword" },
      "subCategory": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "price": { "type": "float" },
      "rating": { "type": "float" },
      "status": { "type": "keyword" },
      "featured": { "type": "boolean" },
      "createdAt": { "type": "date" }
    }
  }
}
```

## REST API

### Create Product

```bash
curl -X POST http://localhost:8000/products \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -d '{
    "sku": "PROD-001",
    "name": "Wireless Headphones",
    "description": "Premium noise-cancelling headphones",
    "category": "electronics",
    "subCategory": "audio",
    "price": 199.99,
    "stock": 100,
    "images": ["https://cdn.example.com/img1.jpg"],
    "tags": ["electronics", "audio", "wireless"]
  }'
```

**Response:**
```json
{
  "id": "cluq9v5k00000qtfe0q9q0q9q",
  "tenantId": "tenant-123",
  "sku": "PROD-001",
  "name": "Wireless Headphones",
  "price": 199.99,
  "stock": 100,
  "status": "ACTIVE",
  "createdAt": "2025-12-17T10:30:00Z"
}
```

### Get Product by ID

```bash
curl http://localhost:8000/products/cluq9v5k00000qtfe0q9q0q9q \
  -H "x-tenant-id: tenant-123"
```

### List Products (Paginated)

```bash
# Get first 20 products
curl "http://localhost:8000/products?skip=0&take=20" \
  -H "x-tenant-id: tenant-123"

# Filter by category and price
curl "http://localhost:8000/products?category=electronics&minPrice=100&maxPrice=500" \
  -H "x-tenant-id: tenant-123"
```

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Wireless Headphones",
      "price": 199.99,
      "rating": 4.5,
      ...
    }
  ],
  "total": 245
}
```

### Search Products (Elasticsearch)

```bash
curl -X POST http://localhost:8000/products/search \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -d '{
    "query": "headphones",
    "category": "electronics",
    "minPrice": 100,
    "maxPrice": 500,
    "skip": 0,
    "take": 20
  }'
```

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Wireless Headphones",
      "price": 199.99,
      "score": 42.15,
      ...
    }
  ],
  "total": 18,
  "skip": 0,
  "take": 20
}
```

### Get Featured Products

```bash
curl "http://localhost:8000/products/featured?take=10" \
  -H "x-tenant-id: tenant-123"
```

### Get Trending Products

```bash
curl "http://localhost:8000/products/trending?take=10" \
  -H "x-tenant-id: tenant-123"
```

### Update Product

```bash
curl -X PUT http://localhost:8000/products/cluq9v5k00000qtfe0q9q0q9q \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -d '{
    "price": 179.99,
    "stock": 95,
    "featured": true
  }'
```

### Delete Product

```bash
curl -X DELETE http://localhost:8000/products/cluq9v5k00000qtfe0q9q0q9q \
  -H "x-tenant-id: tenant-123"
```

### Update Stock

```bash
curl -X PUT http://localhost:8000/products/cluq9v5k00000qtfe0q9q0q9q/stock \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -d '{"quantity": -5}'
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://colorcom:colorcom@colorcom-postgres:5432/colorcom_products

# Elasticsearch
ELASTICSEARCH_URL=http://colorcom-elasticsearch:9200

# Service
PORT=3002
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Running Locally

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Elasticsearch 8.11+
- npm or yarn

### Installation

```bash
cd microservices/product-service
npm install

# Setup Prisma
npx prisma generate
npx prisma migrate dev --name init
```

### Development

```bash
npm run dev
```

Service runs on `http://localhost:3002`

### Production Build

```bash
npm run build
npm start
```

## Security Considerations

1. **Tenant Isolation** - All queries filtered by `x-tenant-id` header
2. **Input Validation** - Class-validator DTOs with strict rules
3. **Rate Limiting** - Kong proxy enforces 100 requests/min per IP
4. **CORS** - Only allows requests from approved origins
5. **Elasticsearch** - No direct access; queries go through NestJS service
6. **Database** - Connection pooling via Prisma, parameterized queries prevent SQL injection

## Performance Optimizations

1. **Elasticsearch** - Indexed by tenantId, category, status, rating
2. **PostgreSQL** - B-tree indexes on frequently queried columns
3. **Pagination** - Default limit 20 products per request
4. **Caching** - Redis integration available (future: implement cache layer)
5. **Full-text search** - Multi-field search with fuzzy matching and field weighting

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

## Deployment

### Docker

```bash
docker build -t colorcom/product-service:latest .
docker run -p 3002:3002 \
  -e DATABASE_URL="postgresql://..." \
  -e ELASTICSEARCH_URL="http://..." \
  colorcom/product-service:latest
```

### Kubernetes

See `k8s/product-service.yaml` for production deployment manifests.

## Troubleshooting

### Elasticsearch not responding

```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Create index template
curl -X PUT http://localhost:9200/_index_template/products \
  -H "Content-Type: application/json" \
  -d @elasticsearch-template.json
```

### Database connection failed

```bash
# Test PostgreSQL connection
psql postgresql://colorcom:colorcom@localhost:5432/colorcom_products

# Run migrations
npx prisma migrate deploy
```

## Future Enhancements

- [ ] Product variants & options (sizes, colors)
- [ ] Redis caching layer for frequently accessed products
- [ ] Batch import/export (CSV, JSON)
- [ ] Product recommendations (ML-based)
- [ ] Advanced analytics & reporting
- [ ] GraphQL API alongside REST
- [ ] Webhooks for product changes
- [ ] Multi-language product support
