# FinTrack — Frontend Context (`client/`)

Next.js 15 (Turbopack) · TypeScript · Tailwind CSS v4 · Bun

## Key Entry Points

| Path | Purpose |
|------|---------|
| `src/app/`              | Next.js 15 App Router pages (budget, investment, reports, login, register) |
| `src/components/`       | Reusable React components |
| `src/lib/api.ts`        | `parseApiResponse<T>()` — unwraps `ApiResponse<T>` from backend |
| `src/lib/auth.ts`       | Auth helpers |
| `src/lib/fintrack.ts`   | Centralized API endpoint definitions |
| `src/middleware.ts`     | Route protection via `access_token` cookie check |
| `.env`                  | Environment variables (copy from `.env.example`) |

## Run & Build Commands

```bash
# Install dependencies
bun install

# Dev server with HTTPS (requires certs in certs/)
bun run dev:https

# Dev server without HTTPS
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Lint
bun run lint
```

## Environment Variables (`client/.env`)

```env
NEXT_PUBLIC_API_BASE_URL=https://localhost:8443
NEXT_PUBLIC_API_PREFIX=/api/v1
```

## API Integration Rules

All API calls **must**:
1. Include `credentials: 'include'` for cookie-based auth.
2. Route through `client/src/lib/fintrack.ts` for endpoint definitions.
3. Use `parseApiResponse<T>()` from `api.ts` to unwrap responses:

```typescript
// ✅ Correct pattern
const data = await parseApiResponse<User>(response);

// ❌ Never access raw response body directly
const data = await response.json();
```

## Auth / Middleware
- `access_token` cookie → short-lived JWT (HttpOnly, Secure, SameSite=Lax)
- `refresh_token` cookie → rotates on every refresh
- `src/middleware.ts` protects all authenticated routes by checking `access_token`

## Styling Rules
- Use **Tailwind CSS v4** utility classes only — no custom CSS unless unavoidable.
- UI primitives from **Radix UI** for accessible components.
- Icons from **Lucide React**.
- Charts via **Recharts**.

## Common Issues
- **Build failures** → check for missing imports; clear cache with `rm -rf .next`
- **API connection errors** → verify `NEXT_PUBLIC_API_BASE_URL` and backend CORS config
- **HTTPS cert errors** → run `mkcert -install` to trust the root CA
- **Cookie not sent** → ensure `credentials: 'include'` is present on every fetch call
