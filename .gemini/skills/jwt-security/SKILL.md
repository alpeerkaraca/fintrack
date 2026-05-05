---
name: jwt-security
description: >
  Expert in FinTrack's JWT authentication, Spring Security configuration, and
  cookie-based session management. Use this skill when the user asks about auth
  flows, token issuance, refresh token rotation, revocation detection, CORS
  configuration, timing-attack prevention, or any security vulnerability in the
  backend or frontend auth layer.
---

# JWT Security — FinTrack Auth Expert

You enforce FinTrack's security model: JWT tokens delivered exclusively via
HttpOnly cookies, refresh-token rotation, and constant-time auth paths.

---

## Token Architecture

| Token | Cookie name | Storage | Lifespan |
|-------|-------------|---------|----------|
| Access JWT | `access_token` | HttpOnly, Secure, SameSite=Lax | Short (e.g., 15 min) |
| Refresh JWT | `refresh_token` | HttpOnly, Secure, SameSite=Lax | Longer (e.g., 7 days) |

**Cookies must never be `SameSite=None` without explicit product justification.**

---

## JWT Requirements

```yaml
# application.yaml
jwt:
  secret: <minimum 32 bytes / 256 bits for HS256>
  access-expiration-ms: 900000    # 15 minutes
  refresh-expiration-ms: 604800000 # 7 days
```

The `JwtService` must validate secret length at startup:
```java
if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
    throw new IllegalStateException("JWT secret must be at least 32 bytes");
}
```

---

## Timing Attack Prevention

Always perform constant-time comparison during authentication:

```java
// ✅ — Always hash against a dummy even when user is not found
private static final String DUMMY_HASH = BCrypt.hashpw("dummy", BCrypt.gensalt());

public void authenticate(String username, String rawPassword) {
    Optional<User> user = userRepository.findByUsername(username);
    String hashToVerify = user.map(User::getPasswordHash).orElse(DUMMY_HASH);
    boolean valid = BCrypt.checkpw(rawPassword, hashToVerify);
    if (user.isEmpty() || !valid) {
        throw new InvalidCredentialsException("Invalid credentials");
    }
}
```

---

## Token Rotation (Refresh Flow)

```
1. Client sends refresh_token cookie
2. Server validates token signature & expiry
3. Server checks token is NOT in the revocation store
4. Server issues a NEW access_token + NEW refresh_token
5. OLD refresh_token is added to the revocation store
6. Both new tokens are written as HttpOnly cookies
```

**If a revoked refresh_token is presented → invalidate ALL tokens for that user
(full session wipe).**

---

## CORS Configuration

```java
// CorsConfig.java — do not loosen these settings
config.setAllowedOrigins(List.of("https://localhost:3000"));
config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS","PATCH"));
config.setAllowCredentials(true);
config.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
```

Never set `allowedOrigins("*")` when `allowCredentials(true)` — browsers block it.

---

## Spring Security Filter Order

1. `JwtAuthenticationFilter` (reads `access_token` cookie, sets `SecurityContext`)
2. `UsernamePasswordAuthenticationFilter` (login endpoint only)
3. Standard Spring Security chain

Spring Security debug mode is **disabled** in production.

---

## Security Audit Checklist

When reviewing any auth-related change, verify:

- [ ] JWT secret ≥ 32 bytes enforced at startup.
- [ ] All auth cookies are HttpOnly + Secure + SameSite=Lax.
- [ ] Constant-time comparison used in the login path (dummy hash present).
- [ ] Refresh token rotation implemented — old token revoked after use.
- [ ] Revoked token detection triggers full session invalidation.
- [ ] CORS `allowedOrigins` does not contain a wildcard.
- [ ] No sensitive data (passwords, raw tokens) logged at any level.
