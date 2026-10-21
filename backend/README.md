# Backend

Spring Boot modular monolith, package-by-feature under `com.example.ecommerce`.

## Package layout

Each feature module is split into sub-packages by role:

| Sub-package | Contents |
| --- | --- |
| `controller` | REST controllers (thin, no business logic) |
| `service` | Business logic and transactions |
| `repository` | Spring Data repositories and query projections |
| `model` | JPA entities and enums |
| `dto` | Request and response records |
| `mapper` | Entity to DTO mapping |
| `exception` | Module specific exceptions |

Module specific extras: `product.specification` (search filters), `payment.gateway` (Stripe adapter and
provider-neutral types), `storage.validation`, `storage.config`.

The `auth`, `user`, `security`, `common` and `config` packages follow the same idea:

- `auth`: `controller`, `service`, `repository`, `model`, `dto`
- `user`: `controller`, `service`, `repository`, `model`, `mapper`, `dto`
- `security`: `config` (filter chain), `filter` (JWT filter), `service` (JWT), `model` (principal)
- `common`: `dto` (`ApiError`, `PageResponse`), `exception` (shared exceptions and handler), `model` (`BaseEntity`), `filter`
- `config`: `properties` (typed `@ConfigurationProperties`) plus top level configuration such as `OpenApiConfig`

Tests mirror the main package of the class under test.

## Module dependency direction

```
order    -> cart, inventory, product
cart     -> product, inventory
product  -> category, inventory, storage
payment  -> order
admin    -> order, inventory, user (aggregate queries only)
category, inventory, storage -> (no feature dependencies)
```

Dependencies never point the other way. `inventory` talks to products through ids and native queries only,
and `category` counts products with SQL, so neither imports `product`.

## Running tests

`mvn verify` runs unit tests and the Docker based integration tests (`BackendIntegrationTest`,
`ShopIntegrationTest`). The integration tests are skipped when Docker is not available.
