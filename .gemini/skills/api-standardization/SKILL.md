---
name: api-standardization
description: >
  Expert in FinTrack's ApiResponse<T> contract between the Spring Boot backend
  and the Next.js frontend. Use this skill when the user is designing a new REST
  endpoint, adding a DTO, updating the frontend API client (fintrack.ts or
  api.ts), or troubleshooting mismatches between what the server returns and what
  the client expects.
---

# API Standardization — FinTrack Contract Expert

You own the API contract between FinTrack's backend and frontend. Every endpoint
must produce exactly the `ApiResponse<T>` envelope, and every frontend call must
unwrap it through `parseApiResponse<T>()`.

---

## Backend: ApiResponse<T> Envelope

```json
{
  "success": true,
  "message": "Budget retrieved successfully",
  "data": { ... },
  "error": null,
  "path": "/api/v1/budgets/123",
  "timestamp": "2026-02-14T10:30:00Z"
}
```

### Java Builder Pattern

```java
// Success
return ResponseEntity.ok(
    ApiResponse.<BudgetDto>builder()
        .success(true)
        .message("Budget retrieved")
        .data(dto)
        .build()
);

// Error (usually handled by GlobalExceptionHandler)
return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
    ApiResponse.<Void>builder()
        .success(false)
        .error("Asset not found: " + symbol)
        .build()
);
```

---

## Frontend: parseApiResponse<T>()

```typescript
// src/lib/api.ts
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body: ApiResponse<T> = await response.json();
  if (!body.success) {
    throw new ApiError(body.error ?? 'Unknown error', response.status);
  }
  return body.data;
}
```

Usage:
```typescript
const budget = await parseApiResponse<BudgetDto>(
  fetch(`${BASE}/budgets/${id}`, { credentials: 'include' })
);
// budget is already typed as BudgetDto — no extra unwrapping needed
```

---

## DTO Design Rules

- DTOs live in `server/.../dto/` — **never expose JPA entities directly**.
- Use `record` types for immutable response DTOs in Java 25:
  ```java
  public record BudgetSummaryDto(
      UUID id,
      String categoryName,
      BigDecimal limit,
      BigDecimal spent,
      BudgetLimitStatus status
  ) {}
  ```
- Request DTOs use classes with Bean Validation annotations:
  ```java
  public class CreateBudgetRequest {
      @NotNull @Positive
      private BigDecimal limit;

      @NotBlank
      private String categoryName;
  }
  ```

---

## Endpoint Conventions

| Action | Method | Path pattern |
|--------|--------|--------------|
| List resources | GET | `/api/v1/{resources}` |
| Get by ID | GET | `/api/v1/{resources}/{id}` |
| Create | POST | `/api/v1/{resources}` |
| Full update | PUT | `/api/v1/{resources}/{id}` |
| Partial update | PATCH | `/api/v1/{resources}/{id}` |
| Delete | DELETE | `/api/v1/{resources}/{id}` |

All paths are prefixed with `/api/v1`.

---

## Frontend Endpoint Registry (fintrack.ts)

Add **all** new endpoint URLs here, never inline:

```typescript
// src/lib/fintrack.ts
const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_PREFIX}`;

export const API = {
  budgets: {
    list:   () => `${BASE}/budgets`,
    get:    (id: string) => `${BASE}/budgets/${id}`,
    create: () => `${BASE}/budgets`,
    update: (id: string) => `${BASE}/budgets/${id}`,
    delete: (id: string) => `${BASE}/budgets/${id}`,
  },
  // ... add new resource groups here
};
```

---

## Contract Checklist

- [ ] Controller returns `ApiResponse<T>` — not raw DTO or entity.
- [ ] Error case returns `ApiResponse<Void>` with `success: false` and `error` populated.
- [ ] New endpoint added to `fintrack.ts` endpoint registry.
- [ ] Frontend uses `parseApiResponse<T>()` — no raw `.json()` on backend responses.
- [ ] Response DTO is a `record` (for responses) or class with validation (for requests).
- [ ] DTO does not expose any JPA entity field that should remain internal.
