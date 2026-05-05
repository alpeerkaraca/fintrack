---
name: docker-infra
description: >
  Expert in FinTrack's Docker Compose infrastructure, local HTTPS certificate
  setup (mkcert), and development environment configuration. Use this skill when
  the user asks about running the full stack locally, setting up certificates,
  configuring environment variables, troubleshooting container connectivity, or
  understanding how the compose.yml services relate to each other.
---

# Docker Infra — FinTrack Environment Expert

You manage FinTrack's local development infrastructure: Docker Compose services,
HTTPS certificates, and environment variable setup.

---

## Service Map

```
compose.yml
├── frontend   → Next.js 15          → https://localhost:3000
├── backend    → Spring Boot 4.0.2   → https://localhost:8443
├── postgres   → PostgreSQL 18       → localhost:5432
└── valkey     → Redis-compatible    → localhost:6379
```

---

## Quick Start Commands

```bash
# Start all services (from project root)
docker compose up

# Rebuild images and start
docker compose up --build

# Stop and remove containers
docker compose down

# View logs for a specific service
docker compose logs -f backend

# Restart a single service
docker compose restart backend
```

---

## Environment Variable Setup

### Root `.env` (Docker Compose secrets)
```env
DB_PASSWORD=your_secure_postgres_password
```

### `client/.env` (Next.js)
```env
NEXT_PUBLIC_API_BASE_URL=https://localhost:8443
NEXT_PUBLIC_API_PREFIX=/api/v1
```

Copy from `.env.example` if it exists. **Never commit `.env` files.**

---

## HTTPS Certificate Setup (mkcert)

```bash
# 1. Install mkcert
brew install mkcert      # macOS
choco install mkcert     # Windows

# 2. Install the local CA
mkcert -install

# 3. Generate certs
mkdir -p certs && cd certs
mkcert localhost 127.0.0.1 ::1
mv localhost+2.pem     localhost.pem
mv localhost+2-key.pem localhost-key.pem

# 4. Copy to backend SSL directory
mkdir -p ../server/src/main/resources/ssl
cp localhost.pem     ../server/src/main/resources/ssl/
cp localhost-key.pem ../server/src/main/resources/ssl/
```

Expected cert files after setup:
```
certs/
├── localhost.pem
└── localhost-key.pem

server/src/main/resources/ssl/
├── localhost.pem
└── localhost-key.pem
```

---

## Java Version Management

```bash
# Switch to JDK 25 (required)
vfox use java@25

# Verify
java -version   # should report 25.x
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Frontend can't reach backend | CORS or URL mismatch | Check `NEXT_PUBLIC_API_BASE_URL`; verify CORS config |
| Flyway fails at startup | DB not ready or migration error | Check `docker compose logs postgres`; verify credentials |
| Redis connection refused | Valkey not running | `docker compose up valkey` |
| SSL handshake error | Certs missing or expired | Re-run mkcert setup above |
| `ERR_CERT_AUTHORITY_INVALID` in browser | CA not trusted | Run `mkcert -install` then restart browser |
| Port already in use | Another process on 3000/8443/5432/6379 | `lsof -i :<port>` to find and kill it |

---

## Prerequisites Summary

| Tool | Required version | Install |
|------|-----------------|---------|
| Java (JDK) | 25 (via vfox) | `vfox install java@25` |
| Maven | Use wrapper only | `./mvnw` — no install needed |
| Node.js | 20+ | nvm or direct |
| Bun | Latest | `curl -fsSL https://bun.sh/install \| bash` |
| Docker | Any recent | docker.com |
| mkcert | Latest | brew/choco |
