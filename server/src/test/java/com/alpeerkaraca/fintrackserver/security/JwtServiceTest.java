package com.alpeerkaraca.fintrackserver.security;

import com.alpeerkaraca.fintrackserver.dto.TokenPair;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private final String SECRET = "fintrack-cok-gizli-test-key-32-karakter-uzunlugunda";
    private final String ISSUER = "fintrack-auth-server";
    private final String AUDIENCE = "fintrack-app";
    private final long ACCESS_EXP = 3600000; // 1 saat
    private final long REFRESH_EXP = 86400000; // 1 gün
    private JwtService jwtService;

    @BeforeEach
    void setUp() throws NoSuchAlgorithmException {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtIssuer", ISSUER);
        ReflectionTestUtils.setField(jwtService, "jwtAudience", AUDIENCE);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMillis", ACCESS_EXP);
        ReflectionTestUtils.setField(jwtService, "jwtRefreshExpirationMillis", REFRESH_EXP);
    }

    @Test
    @DisplayName("Should successfully generate Access and Refresh Token pair")
    void shouldGenerateValidTokenPair() {
        String userId = UUID.randomUUID().toString();
        List<String> roles = List.of("ROLE_USER");

        TokenPair pair = jwtService.generateTokenPair(userId, "alper@karaca.com", "alpeerkaraca", roles);

        assertThat(pair).isNotNull();
        assertThat(pair.accessToken()).isNotEmpty();
        assertThat(pair.refreshToken()).isNotEmpty();

        // Üretilen token'ın içini gerçekten parse edip otomata değil, gerçeğe bakıyoruz
        assertThat(jwtService.validateToken(pair.accessToken(), "access")).isTrue();
        assertThat(jwtService.validateToken(pair.refreshToken(), "refresh")).isTrue();
    }

    @Test
    @DisplayName("Should correctly extract claims including username, userId, and roles")
    void shouldExtractClaimsCorrectly() {
        String userId = UUID.randomUUID().toString();
        String username = "testuser";
        List<String> roles = List.of("ROLE_USER", "ROLE_ADMIN");

        TokenPair pair = jwtService.generateTokenPair(userId, "test@test.com", username, roles);

        assertThat(jwtService.extractUsername(pair.accessToken())).isEqualTo(username);
        assertThat(jwtService.extractUserId(pair.accessToken())).isEqualTo(userId);
        assertThat(jwtService.extractRoles(pair.accessToken())).containsExactlyElementsOf(roles);
    }

    @Test
    @DisplayName("Should fail validation when token type mismatch occurs")
    void shouldFailWhenTokenTypeMismatch() {
        TokenPair pair = jwtService.generateTokenPair("1", "t@t.com", "u", List.of("R"));

        boolean isValid = jwtService.validateToken(pair.refreshToken(), "access");

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should fail validation when token is tampered or manipulated")
    void shouldFailWhenTokenIsTampered() {
        TokenPair pair = jwtService.generateTokenPair("1", "t@t.com", "u", List.of("R"));
        String tamperedToken = pair.accessToken() + "manipulated";

        boolean isValid = jwtService.validateToken(tamperedToken);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should provide consistent SHA-256 hashing for refresh tokens")
    void shouldHashRefreshTokenConsistently() {
        String token = "dummy-refresh-token";

        String hash1 = jwtService.hashRefreshToken(token);
        String hash2 = jwtService.hashRefreshToken(token);

        assertThat(hash1).isEqualTo(hash2);
        assertThat(hash1).isNotEqualTo(token);
    }
}