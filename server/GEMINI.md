# FinTrack — Backend Context (`server/`)

Spring Boot 4.0.2 · Java 25 · Maven · PostgreSQL 18 · Redis/Valkey 7.2

## Key Entry Points

| Path | Purpose |
|------|---------|
| `src/main/java/com/alpeerkaraca/fintrackserver/controller/` | REST endpoints |
| `src/main/java/com/alpeerkaraca/fintrackserver/service/`    | Business logic |
| `src/main/java/com/alpeerkaraca/fintrackserver/model/`      | JPA entities |
| `src/main/java/com/alpeerkaraca/fintrackserver/dto/`        | Request / response objects |
| `src/main/java/com/alpeerkaraca/fintrackserver/security/`   | JWT service, filters |
| `src/main/java/com/alpeerkaraca/fintrackserver/config/`     | Security, CORS, cache configs |
| `src/main/java/com/alpeerkaraca/fintrackserver/exception/`  | Custom exceptions & global handler |
| `src/main/resources/db/migration/`                          | Flyway SQL migrations |
| `src/main/resources/application.yaml`                       | Application configuration |

## Run & Build Commands

```bash
# Development
./mvnw spring-boot:run

# Compile only (fast)
./mvnw clean compile -DskipTests -q

# Full test suite
./mvnw clean test

# Single test class
./mvnw test -Dtest=AuthServiceTest

# Single test method
./mvnw test -Dtest=AuthServiceTest#testLoginSuccess

# Coverage report (output: target/site/jacoco/index.html)
./mvnw test jacoco:report

# Package JAR
./mvnw clean package -DskipTests
```

## Architecture Rules

### API Response
Every controller method **must** return `ApiResponse<T>`:
```java
// ✅ Correct
public ResponseEntity<ApiResponse<UserDto>> getUser(...) { ... }

// ❌ Never return raw objects
public ResponseEntity<UserDto> getUser(...) { ... }
```

### Service Layer
- Calculate all business logic in services; never store computed values in the DB.
- Use `@Cacheable` for expensive market-data and dashboard operations.
- Inject dependencies via constructor — Lombok `@RequiredArgsConstructor`.

### Exception Handling
Use `@RestControllerAdvice` global handler. Available custom exceptions:

| Exception | HTTP |
|-----------|------|
| `InvalidCredentialsException` | 401 |
| `UserNotFoundException` | 404 |
| `AssetNotFoundException` | 404 |
| `AssetAlreadyExistsException` | 409 |
| `AssetDeleteException` | 409 |
| `MarketDataFetchException` | 503 |

Log WARN for 4xx, ERROR for 5xx. Always include contextual info (userId, etc.).

### Financial Calculations — Zero Division Guard (mandatory)
```java
if (limit.compareTo(BigDecimal.ZERO) <= 0) {
    return BudgetLimitStatus.SAFE;
}
```

### Caching Regions
| Cache | TTL |
|-------|-----|
| `exchangeRates` | 1 day |
| `fundPrices` | 1 day |
| `metalPrices` | 5 minutes |
| `overviews` | 2 minutes |

Cache key format: `userId:YYYY-MM`. Config: `CacheConfig.java`.

### Security
- JWT secret: minimum 32 bytes (HS256).
- All auth cookies: `HttpOnly`, `Secure`, `SameSite=Lax`.
- Constant-time auth (dummy bcrypt) to prevent timing attacks.
- Token rotation: each refresh invalidates the previous token.
- Revoked token detected → full session invalidation.
- CORS allowed origin: `https://localhost:3000`.

## External APIs
- Exchange rates: `exchangerate-api.com`
- Market data scraping: BloombergHT, Fundfy via Jsoup
- Stock data: Yahoo Finance API

## Database Indexes
```sql
budget_month_user_year_month
budget_category_user_month
transaction_user_date
investment_assets_symbol
```

## Common Issues
- **Wrong Java version** → `vfox use java@25` then verify with `java -version`
- **DB not connecting** → ensure PostgreSQL is running on port 5432
- **Cache miss errors** → verify Redis/Valkey on port 6379; check `CacheConfig.java`
- **SSL errors** → regenerate certs with mkcert; check `certs/` and `server/src/main/resources/ssl/`
