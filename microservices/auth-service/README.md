# Auth Service — ColorCom

This is the **PHASE 2** centralized Authentication service for ColorCom. It handles:

- ✅ User registration and login
- ✅ JWT token generation and refresh
- ✅ OAuth2 / OpenID Connect (placeholders for integration)
- ✅ Multi-tenant user access management
- ✅ Reusable JWT guard (shared across all services)
- ✅ Tenant guard for multi-tenancy
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Audit logging support

## Tech Stack

- **NestJS** — Backend framework
- **PostgreSQL** — User and token storage
- **Prisma** — ORM + migrations
- **JWT** — Stateless authentication
- **Passport.js** — Authentication middleware
- **bcrypt** — Password hashing

## Project Structure

```
src/
├── domain/              # Business logic & DTOs
│   └── dto/
│       ├── login.dto.ts
│       ├── register.dto.ts
│       └── refresh-token.dto.ts
├── application/         # Use cases & services
│   └── services/
│       └── auth.service.ts
├── infrastructure/      # Controllers, guards, strategies, DB
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── guards/
│   │   ├── tenant.guard.ts
│   │   └── role.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── prisma/
│       └── prisma.service.ts
├── app.module.ts
└── main.ts
prisma/
└── schema.prisma        # Database schema
```

## Database Schema

The service creates these tables:

- `users` — User accounts (email, username, passwordHash, profile)
- `roles` — Role definitions (name, permissions)
- `refresh_tokens` — Refresh token tracking (expiry, revocation)
- `oauth_accounts` — OAuth2/OIDC provider linkage
- `tenant_access` — Multi-tenant user access (userId → tenantId → role)
- `audit_logs` — Login/logout/action audit trail

## API Endpoints

### Public Endpoints

```bash
# Register a new user
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Refresh token
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

# Health check
GET /auth/health
```

### Protected Endpoints

```bash
# Get current user (requires JWT)
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# Logout (requires JWT)
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## JWT Payload

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "roles": ["admin", "vendor"],
  "tenants": [
    { "tenantId": "tenant-1", "role": "owner" },
    { "tenantId": "tenant-2", "role": "vendor" }
  ],
  "iat": 1704067200,
  "exp": 1704068100
}
```

## Quick Start

### 1. Install Dependencies

```bash
cd microservices/auth-service
npm install
```

### 2. Set Environment Variables

Create `.env`:

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://colorcom:colorcom123@localhost:5432/colorcom_auth
JWT_SECRET=your-super-secret-jwt-key-change-in-prod
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the Service

```bash
npm run dev
```

Service runs at `http://localhost:3001` and is accessible through Kong at `http://localhost:8000/auth`.

## Using with Kong Gateway

Kong automatically routes requests to this service:

```bash
# Register through Kong
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Login through Kong
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

Kong adds headers like `x-correlation-id` and `x-tenant-id` which are available in `req.headers`.

## Reusable Guards (For Other Services)

These guards are exported and can be reused in other microservices:

### 1. JWT Guard (Authentication)

```typescript
@UseGuards(AuthGuard('jwt'))
@Get('protected')
protectedRoute(@Req() req: any) {
  console.log(req.user.id); // User ID from JWT
}
```

### 2. Tenant Guard (Multi-Tenancy)

```typescript
@UseGuards(TenantGuard)
@Get('tenant-data')
getTenantData(@Req() req: any) {
  console.log(req.tenantId); // x-tenant-id header value
}
```

### 3. Role Guard (Authorization)

```typescript
@Roles(['admin', 'vendor'])
@UseGuards(AuthGuard('jwt'), RoleGuard)
@Get('admin-only')
adminOnlyRoute(@Req() req: any) {
  // Only admins or vendors can access
}
```

## Testing with Curl

```bash
# 1. Register
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "password":"SecurePass123",
    "username":"testuser",
    "firstName":"Test",
    "lastName":"User"
  }')

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.refreshToken')

# 2. Use access token
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Refresh token
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# 4. Logout
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Security Best Practices

1. **JWT Secret** — Use a strong, random secret (change in production)
2. **HTTPS** — Always use HTTPS in production (Kong terminates TLS)
3. **Refresh Tokens** — Stored in DB, can be revoked
4. **Password Hashing** — bcrypt with salt rounds = 10
5. **Rate Limiting** — Kong enforces rate limits (100 req/min)
6. **CORS** — Configured for frontend origin only
7. **Audit Logging** — All auth actions logged in `audit_logs` table
8. **Token Expiry** — Short-lived access tokens (15m) + long-lived refresh tokens (7d)

## OAuth2 / OpenID Connect Integration (Placeholder)

The schema includes `oauth_accounts` table for linking external providers. To add OAuth2:

1. Install provider strategy (e.g., `passport-google-oauth20`)
2. Create OAuth strategy in `src/infrastructure/strategies/`
3. Add OAuth controller endpoint
4. Link account to user in `oauth_accounts` table

Example providers to add later:
- Google
- GitHub
- Apple
- Microsoft

## Next Steps

After Auth Service is running:

1. **Product Service** — CRUD products + Elasticsearch search
2. **Vendor Service** — Multi-vendor management + CMS
3. **Cart Service** — Redis-backed shopping cart
4. **Order Service** — Order creation + payment webhooks
5. **Event Bus** — Kafka for async events

## Troubleshooting

### "Cannot connect to PostgreSQL"
Ensure PostgreSQL is running and `DATABASE_URL` is correct.

### "JWT_SECRET is not set"
Set `JWT_SECRET` in `.env` or environment.

### "Prisma migration failed"
Run `npx prisma db push` or delete `/prisma/migrations` and run `npx prisma migrate dev --name init`.

### "Port 3001 already in use"
Change PORT in `.env` or kill the process using the port.

## More Info

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport.js Strategies](http://www.passportjs.org)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
