package com.alpeerkaraca.fintrackserver.security;

import com.alpeerkaraca.fintrackserver.dto.TokenPair;
import com.alpeerkaraca.fintrackserver.exception.TokenGenerationException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;

@Service
@Slf4j
public class JwtService {
    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_TOKEN_TYPE = "tokenType";
    private static final String TOKEN_TYPE_REFRESH = "refresh";
    private static final String TOKEN_TYPE_ACCESS = "access";
    @Value("${app.jwt.secret}")
    private String jwtSecret;
    @Value("${app.jwt.expiration}")
    private long jwtExpirationMillis;
    @Value("${app.jwt.refresh-expiration}")
    private long jwtRefreshExpirationMillis;
    @Value("${app.jwt.issuer}")
    private String jwtIssuer;
    @Value("${app.jwt.audience}")
    private String jwtAudience;
    private final MessageDigest digest;

    public JwtService() throws NoSuchAlgorithmException {
        this.digest = MessageDigest.getInstance("SHA-256");
    }


    public TokenPair generateTokenPair(String userId, String email, String username, List<String> roles) {
        try {

            Map<String, Object> accessClaims = new HashMap<>();
            accessClaims.put(CLAIM_USER_ID, userId);
            accessClaims.put(CLAIM_ROLES, roles);
            accessClaims.put(CLAIM_EMAIL, email);
            accessClaims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS);

            String accessToken = generateToken(accessClaims, username, jwtExpirationMillis);

            Map<String, Object> refreshClaims = new HashMap<>();
            refreshClaims.put(CLAIM_USER_ID, userId);
            refreshClaims.put(CLAIM_ROLES, roles);
            refreshClaims.put(CLAIM_EMAIL, email);
            refreshClaims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH);

            String refreshToken = generateToken(refreshClaims, username, jwtRefreshExpirationMillis);

            return new TokenPair(accessToken, refreshToken);
        } catch (Exception e) {
            throw new TokenGenerationException("Error while generating token pair", e);
        }
    }

    public String generateToken(Map<String, Object> claims, String subject, long expirationMs) {
        Instant now = Instant.now();
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .issuer(jwtIssuer)
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .audience().add(jwtAudience).and().compact();
    }

    public Jws<Claims> parseAndVerify(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .requireIssuer(jwtIssuer)
                    .requireAudience(jwtAudience)
                    .build()
                    .parseSignedClaims(token);
        } catch (JwtException e) {
            log.debug("Failed to verify JWT: {}", e.getMessage());
            throw e;
        }
    }


    public boolean validateToken(String token) {
        return validateToken(token, null);
    }

    /**
     * @param expectedTokenType "access" or "refresh" (or null to accept either)
     */
    public boolean validateToken(String token, String expectedTokenType) {
        try {
            Claims claims = parseAndVerify(token).getPayload();

            // required claims
            String userId = claims.get(CLAIM_USER_ID, String.class);
            String email = claims.get(CLAIM_EMAIL, String.class);
            String tokenType = claims.get(CLAIM_TOKEN_TYPE, String.class);

            if (userId == null || userId.isBlank()) return false;
            if (email == null || email.isBlank()) return false;
            if (tokenType == null || tokenType.isBlank()) return false;

            if (expectedTokenType != null && !expectedTokenType.equals(tokenType)) return false;

            Date exp = claims.getExpiration();
            return exp != null && exp.after(Date.from(Instant.now()));
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid token: {}", e.getMessage());
            return false;
        }
    }


    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String jwtToken) {
        return parseAndVerify(jwtToken).getPayload().getSubject();
    }

    public String extractUserId(String jwtToken) {
        return parseAndVerify(jwtToken).getPayload().get(CLAIM_USER_ID, String.class);
    }

    public List<String> extractRoles(String jwtToken) {
        return parseAndVerify(jwtToken).getPayload().get(CLAIM_ROLES, List.class);
    }
    public String extractEmail(String jwtToken) {
        return parseAndVerify(jwtToken).getPayload().get(CLAIM_EMAIL, String.class);
    }

    public String hashRefreshToken(String refreshToken) {
        byte[] hashBytes = digest.digest(refreshToken.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hashBytes);
    }
}
