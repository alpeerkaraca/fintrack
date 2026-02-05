# FinTrack

FinTrack is a full-stack personal finance app with:
- `client/`: Next.js 15 frontend (dashboard, budget, investments, reports)
- `server/`: Spring Boot backend (auth + finance APIs)
- `postgres`: PostgreSQL database via Docker Compose

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Recharts
- Backend: Spring Boot, Spring Security, Spring Data JPA, JWT
- Database: PostgreSQL

## Project Structure

```text
fintrack/
  client/        # Next.js app
  server/        # Spring Boot app
  compose.yml    # frontend + backend + postgres services
```

## Prerequisites

- Node.js 20+
- bun
- Java 25
- Maven (or use `./mvnw`)
- Docker (optional, for compose-based run)

## Environment Variables

### Root `.env` (used by Docker Compose / backend)

```env
DB_PASSWORD=your_postgres_password
```

### Frontend `client/.env`

```env
NEXT_PUBLIC_API_BASE_URL=https://localhost:8443
NEXT_PUBLIC_API_PREFIX=/api/v1
```

The frontend already includes `client/.env.example` with these values.

## Run Locally

### 1) Install and Use Self Signed Certs via mkcert

Install mkcert:

```bash
brew install mkcert # macOS
choco install mkcert # Windows
mkcert -install
```
Generate certs under [certs directory](./certs) and [server/src/main/resources/ssl](server/src/main/resources/ssl): :

```bash
mkdir -p certs
cd certs
mkcert localhost 127.0.0.1 ::1
mv localhost+2.pem localhost.pem
mv localhost+2-key.pem localhost-key.pem
cp localhost.pem ../server/src/main/resources/ssl/
cp localhost-key.pem ../server/src/main/resources/ssl/
cd ..
```

### 1) Start backend

From `server/`:

```bash
./mvnw spring-boot:run```
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend default: `https://localhost:8443`

### 2) Start frontend

From `client/`:

```bash
bun install
bun run dev:https
```

Frontend default: `https://localhost:3000`

## Auth Flow (Current)

Frontend uses cookie-based auth:

- Cookies are set by backend with:
  - `access_token`
  - `refresh_token`
- Cookies are expected to be:
  - `HttpOnly`
  - `Secure`
  - `SameSite=Lax`
- Frontend sends authenticated requests with `credentials: include`.

Auth routes:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Frontend Routes

- `/login`
- `/register`
- `/dashboard`
- `/budget`
- `/investment`
- `/reports`

## Notes

- If you change backend base URL, update `client/.env`.
- If auth cookie names change, also update `client/src/middleware.ts`.
