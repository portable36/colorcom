# Architecture & Service Guide

This document is a machine-friendly, formatted version of the project's high-level architecture notes (previously `info.txt`). It summarizes the main services, integration patterns, operational guidance, and enterprise considerations.

## 1. Identity & Auth Service

- User login / registration
- Multi-tenant support
- Role-based access
- Token rotation & refresh
- Social login (Google, Facebook)
- Device/session tracking
- Tenant resolution
- Rate limiting
- Auth validation
- Request routing
- Circuit breaking
- Centralized auth
- Fine-grained permissions

## 2. Vendor / Merchant Service (Multi-Vendor)

- Vendor onboarding
- Store settings
- Commission rules
- Payout configuration
- Vendor analytics
- Report generation (PDF)
- Compliance checks
- Store configuration
- Seller performance metrics

## 3. Product Catalog Service

- Products, variants, attributes
- Categories & tags
- SEO metadata
- Bulk import/export
- Search indexing
- Images & videos
- Category taxonomy

## 4. Inventory Service

- Stock levels and tracking
- Reservations (during checkout)
- Low-stock alerts
- Multi-warehouse support (create/update/delete warehouses)
- Event-driven sync
- Prevent overselling
- Report generation (PDF)

## 5. Cart Service

- Guest & user carts
- Cart expiration
- Coupon preview
- Price recalculation

## 6. Order Service

- Order creation & lifecycle
- Order status (Pending, Paid, Shipped)
- Order history
- Invoice generation
- Returns & refunds
- Multi-vendor split orders
- Report generation (PDF)

## Integration patterns

- Synchronous (REST / gRPC): used for reads and validation (e.g., Order -> Inventory check).
- Asynchronous (Events): used for state changes and scalability (e.g., OrderCreated → Payment → Inventory → Shipping).

Event tools: Kafka / EventBridge / SNS / SQS

Example flow:
1. User places order
2. Order Service creates order (PENDING)
3. Event: OrderCreated
4. Payment Service charges
5. Event: PaymentSuccess
6. Inventory reserves stock
7. Fulfillment starts
8. Order becomes CONFIRMED

If payment fails → compensation events rollback inventory

## 7. Payment Service

- Payment intents
- Webhook verification
- bKash, SSLCommerz, Stripe, PayPal
- Refund handling
- Fraud checks and verification
- Gateway integration
- Report generation (PDF)

## 8. Shipping / Logistics Service

- Courier integrations (Pathao, Steadfast, etc.)
- Tracking IDs and delivery updates
- Courier rate calculation and label generation
- Shipping rules and warehouse selection
- Report generation (PDF)

## 9. Accounting / Finance Service

- Vendor payouts
- Platform commissions
- Ledger entries, Tax/VAT
- Financial reports (P&L)
- Expenses (product cost, marketing, delivery cost)
- Invoices and reports (PDF)

## 10. Review & Rating Service

- Product reviews and ratings
- Moderation and abuse prevention
- Vendor ratings

## 11. Wishlist Service

- Wishlist management and stock notifications
- Price-drop alerts and saved lists

## 12. Notification Service

- Email, SMS, Push notifications
- Order updates and OTP delivery

## 13. Search Service

- Full-text search and filters
- Auto-suggest and ranking/boosting
- Personalization signals

## 14. Analytics & Reporting Service

- Sales and funnel reports
- Vendor performance and customer behavior
- Accounting, inventory, and shipping reports
- Async PDF generation: request → ReportRequested → background worker → store in Media Service → notify user

## 15. AI / Recommendation Service

- Product recommendations and related items
- AI chatbot for customer support
- Demand prediction

## 16. Caching Layer

- Redis for object/session/product caches
- HTTP caching and TTL strategies

## 17. Event Bus

- Order events
- Payment events
- Inventory sync
- Email triggers

## 18. Observability Stack

- Centralized logging
- Metrics (Prometheus)
- Tracing and error tracking

## 19. Security Must-Haves

- HTTPS/TLS everywhere
- Tenant data isolation
- Rate limiting
- API signing and webhook validation
- Encryption at rest & secrets manager
- mTLS for service-to-service communication
- Least privilege IAM
- WAF and signed internal requests

## 20. Tenant Management Service

- Create/manage tenants (shops)
- Subscription & plan limits
- Feature toggles
- Domain mapping (shop.domain.com)

## 21. Pricing & Promotion Service

- Discounts, coupons, flash sales
- Dynamic pricing

## 22. Return & Refund Service

- Return requests
- Refund workflow and dispute handling

## 23. Marketing & Analytics Service

- Campaign tracking
- Google Tag Manager / Facebook Pixel
- Conversion analytics

## 24. AI Customer Support Service

- Chatbot and auto ticket routing

## 25. File / Media Service

- Image & video storage
- Compression and resize
- CDN integration

## Enterprise considerations

- Fraud detection, risk scoring, and settlement
- Recommendation engine and data warehouse/BI

## Golden rules for multi-tenancy

- Every service must accept `tenant_id` and enforce isolation
- Emit tenant-aware events and cache per tenant
- Each service owns its database; no cross-service joins or direct DB access
- `tenant_id` must come from gateway resolver (not from client body)

## Idempotency (non-negotiable for payments & orders)

- Use `Idempotency-Key` header
- Implement idempotency layer and repository (e.g., `libs/common/idempotency/`)
- Backed by Redis or DB unique constraints

## Storefront

- Tech: Next.js + PWA (SSR for SEO; offline support; mobile-first)

---

For operational notes, per-service Quickstarts and documentation are available under `microservices/<service>/README.md`. This document is a summary — keep `docs/ARCHITECTURE.md` in sync with `info.txt` or use it as the canonical reference for architecture decisions.