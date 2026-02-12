package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.*;
import com.alpeerkaraca.fintrackserver.exception.EmailAlreadyExistsException;
import com.alpeerkaraca.fintrackserver.exception.InvalidCredentialsException;
import com.alpeerkaraca.fintrackserver.model.RefreshToken;
import com.alpeerkaraca.fintrackserver.model.UserProfile;
import com.alpeerkaraca.fintrackserver.repository.RefreshTokenRepository;
import com.alpeerkaraca.fintrackserver.repository.UserProfileRepository;
import com.alpeerkaraca.fintrackserver.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final String DEFAULT_USER_ROLE = "ROLE_USER";
    private static final String DUMMY_PASSWORD_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP";

    private final UserProfileRepository userProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResult registerUser(RegisterRequest request) {
        if (userProfileRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException("Email already in use");
        }

        UserProfile newUser = UserProfile.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .netSalaryUsd(request.netSalaryUsd())
                .build();

        userProfileRepository.save(newUser);

        return new AuthResult(newUser.getId(), newUser.getUsername(), newUser.getEmail(), newUser.getNetSalaryUsd());
    }

    public AuthResult loginUser(LoginRequest request) {
        UserProfile user = userProfileRepository.findByUsername(request.username())
                .orElse(null);

        String passwordHash = (user != null) ? user.getPassword() : DUMMY_PASSWORD_HASH;
        boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);

        if (user == null || !passwordMatches) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        return new AuthResult(user.getId(), user.getUsername(), user.getEmail(), user.getNetSalaryUsd());
    }

    /**
     * Generate a new access+refresh pair for a user and persist refresh token hash for rotation/revocation.
     */
    @Transactional
    public TokenPair issueTokensForUser(UUID userId, String email, String username, List<String> roles,
                                        String ipAddress, String userAgent) {
        TokenPair pair = jwtService.generateTokenPair(
                userId.toString(),
                email,
                username,
                roles
        );

        saveRefreshToken(pair.refreshToken(), ipAddress, userAgent);
        return pair;
    }

    @Transactional
    public TokenPair refreshTokens(String refreshTokenRaw, String ipAddress, String userAgent) {
        if (refreshTokenRaw == null || refreshTokenRaw.isBlank()) {
            throw new RuntimeException("Missing refresh token");
        }

        if (!jwtService.validateToken(refreshTokenRaw, "refresh")) {
            throw new RuntimeException("Invalid refresh token");
        }

        String tokenHash = jwtService.hashRefreshToken(refreshTokenRaw);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Refresh token not recognized"));

        if (stored.isRevoked()) {
            // Optional: revoke all sessions for that user on reuse detection
            // refreshTokenRepository.deleteByUserId(stored.getUserId());
            throw new RuntimeException("Refresh token revoked");
        }

        Date exp = stored.getExpiresAt();
        if (exp == null || exp.toInstant().isBefore(Instant.now())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new RuntimeException("Refresh token expired");
        }

        // Build new pair from claims (subject/email/roles/userId)
        Jws<Claims> jws = jwtService.parseAndVerify(refreshTokenRaw);
        Claims claims = jws.getPayload();

        UUID userId = UUID.fromString(claims.get("userId", String.class));
        String email = claims.get("email", String.class);
        String username = claims.getSubject();
        List<String> roles = claims.get("roles", List.class);

        TokenPair newPair = jwtService.generateTokenPair(userId.toString(), email, username, roles);

        // Save new refresh token row
        RefreshToken newEntity = buildRefreshTokenEntity(newPair.refreshToken(), ipAddress, userAgent);
        refreshTokenRepository.save(newEntity);

        // Revoke old
        stored.setRevoked(true);
        stored.setReplacedBy(newEntity.getId());
        refreshTokenRepository.save(stored);

        return newPair;
    }

    private void saveRefreshToken(String refreshTokenRaw, String ipAddress, String userAgent) {
        if (!jwtService.validateToken(refreshTokenRaw, "refresh")) {
            throw new RuntimeException("Invalid refresh token");
        }
        RefreshToken tokenEntity = buildRefreshTokenEntity(refreshTokenRaw, ipAddress, userAgent);
        refreshTokenRepository.save(tokenEntity);
    }

    private RefreshToken buildRefreshTokenEntity(String refreshTokenRaw, String ipAddress, String userAgent) {
        Jws<Claims> tokenClaims = jwtService.parseAndVerify(refreshTokenRaw);
        Claims c = tokenClaims.getPayload();

        UUID userId = UUID.fromString(c.get("userId", String.class));

        return RefreshToken.builder()
                .tokenHash(jwtService.hashRefreshToken(refreshTokenRaw))
                .jti(c.getId())
                .userId(userId)
                .issuedAt(c.getIssuedAt())
                .expiresAt(c.getExpiration())
                .revoked(false)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
    }

    public List<String> defaultRoles() {
        return Collections.singletonList(DEFAULT_USER_ROLE);
    }
}
