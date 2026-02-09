package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.AuthResult;
import com.alpeerkaraca.fintrackserver.dto.LoginRequest;
import com.alpeerkaraca.fintrackserver.dto.RegisterRequest;
import com.alpeerkaraca.fintrackserver.dto.TokenPair;
import com.alpeerkaraca.fintrackserver.exception.EmailAlreadyExistsException;
import com.alpeerkaraca.fintrackserver.model.RefreshToken;
import com.alpeerkaraca.fintrackserver.model.UserProfile;
import com.alpeerkaraca.fintrackserver.repository.RefreshTokenRepository;
import com.alpeerkaraca.fintrackserver.repository.UserProfileRepository;
import com.alpeerkaraca.fintrackserver.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @InjectMocks
    private AuthService authService;

    private UUID userId;
    private String email;
    private String username;
    private String password;
    private String encodedPassword;
    private BigDecimal netSalaryUsd;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        email = "test@example.com";
        username = "testuser";
        password = "password123";
        encodedPassword = "encodedPassword123";
        netSalaryUsd = BigDecimal.valueOf(5000);
    }

    @Test
    void shouldRegisterUserSuccessfully() {
        RegisterRequest request = new RegisterRequest(username, email, password, netSalaryUsd);
        UserProfile savedUser = UserProfile.builder()
                .username(username)
                .email(email)
                .password(encodedPassword)
                .netSalaryUsd(netSalaryUsd)
                .build();

        when(userProfileRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn(encodedPassword);
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(savedUser);

        AuthResult result = authService.registerUser(request);

        assertThat(result.username()).isEqualTo(username);
        assertThat(result.email()).isEqualTo(email);
        assertThat(result.netSalaryUsd()).isEqualTo(netSalaryUsd);
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    void shouldThrowExceptionWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest(username, email, password, netSalaryUsd);
        when(userProfileRepository.existsByEmail(email)).thenReturn(true);

        assertThatThrownBy(() -> authService.registerUser(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessage("Email already in use");

        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }

    @Test
    void shouldLoginUserWithValidCredentials() {
        LoginRequest request = new LoginRequest(username, password);
        UserProfile user = UserProfile.builder()
                .id(userId)
                .username(username)
                .email(email)
                .password(encodedPassword)
                .netSalaryUsd(netSalaryUsd)
                .build();

        when(userProfileRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, encodedPassword)).thenReturn(true);

        AuthResult result = authService.loginUser(request);

        assertThat(result.id()).isEqualTo(userId);
        assertThat(result.username()).isEqualTo(username);
        assertThat(result.email()).isEqualTo(email);
        assertThat(result.netSalaryUsd()).isEqualTo(netSalaryUsd);
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        LoginRequest request = new LoginRequest(username, password);
        when(userProfileRepository.findByUsername(username)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.loginUser(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    void shouldThrowExceptionWhenPasswordDoesNotMatch() {
        LoginRequest request = new LoginRequest(username, password);
        UserProfile user = UserProfile.builder()
                .id(userId)
                .username(username)
                .password(encodedPassword)
                .build();

        when(userProfileRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, encodedPassword)).thenReturn(false);

        assertThatThrownBy(() -> authService.loginUser(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    void shouldIssueTokensForUserSuccessfully() {
        List<String> roles = List.of("ROLE_USER");
        String ipAddress = "127.0.0.1";
        String userAgent = "Mozilla/5.0";
        String accessToken = "access.token.here";
        String refreshToken = "refresh.token.here";
        String tokenHash = "hashedToken";
        String jti = UUID.randomUUID().toString();

        TokenPair tokenPair = new TokenPair(accessToken, refreshToken);

        Claims claims = mock(Claims.class);
        when(claims.getId()).thenReturn(jti);
        Jws<Claims> jws = mock(Jws.class);

        when(jwtService.generateTokenPair(userId.toString(), email, username, roles)).thenReturn(tokenPair);
        when(jwtService.parseAndVerify(refreshToken)).thenReturn(jws);
        when(jwtService.validateToken(refreshToken, "refresh")).thenReturn(true);
        when(claims.get("userId", String.class)).thenReturn(userId.toString());
        when(jwtService.hashRefreshToken(refreshToken)).thenReturn(tokenHash);
        when(jws.getPayload()).thenReturn(claims);

        TokenPair result = authService.issueTokensForUser(userId, email, username, roles, ipAddress, userAgent);

        assertThat(result.accessToken()).isEqualTo(accessToken);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void shouldRefreshTokensSuccessfully() {
        String oldRefreshToken = "old.refresh.token";
        String tokenHash = "hashedToken";
        String ipAddress = "127.0.0.1";
        String userAgent = "Mozilla/5.0";
        String jti = UUID.randomUUID().toString();
        List<String> roles = List.of("ROLE_USER");
        Date now = new Date();
        Date future = new Date(System.currentTimeMillis() + 86400000);

        Jws<Claims> oldJws = mock(Jws.class);
        Claims oldClaims = mock(Claims.class);
        when(oldJws.getPayload()).thenReturn(oldClaims);
        when(oldClaims.getSubject()).thenReturn(username);
        when(oldClaims.get("userId", String.class)).thenReturn(userId.toString());
        when(oldClaims.get("email", String.class)).thenReturn(email);
        when(oldClaims.get("roles", List.class)).thenReturn(roles);

        RefreshToken storedToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .userId(userId)
                .jti(jti)
                .issuedAt(new Date())
                .expiresAt(new Date(System.currentTimeMillis() + 86400000))
                .revoked(false)
                .build();

        Claims claims = mock(Claims.class);

        TokenPair newTokenPair = new TokenPair("new.access.token", "new.refresh.token");

        when(jwtService.validateToken(oldRefreshToken, "refresh")).thenReturn(true);
        when(jwtService.hashRefreshToken(oldRefreshToken)).thenReturn(tokenHash);
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(storedToken));
        when(jwtService.generateTokenPair(userId.toString(), email, username, roles)).thenReturn(newTokenPair);
        when(jwtService.hashRefreshToken(newTokenPair.refreshToken())).thenReturn("newHash");
        when(jwtService.parseAndVerify(oldRefreshToken)).thenReturn(oldJws);
        Jws<Claims> newJws = mock(Jws.class);
        Claims newClaims = mock(Claims.class);
        when(newJws.getPayload()).thenReturn(newClaims);
        when(newClaims.getId()).thenReturn(UUID.randomUUID().toString());
        when(newClaims.get("userId", String.class)).thenReturn(userId.toString());
        when(newClaims.getIssuedAt()).thenReturn(now);
        when(newClaims.getExpiration()).thenReturn(future);
        when(jwtService.parseAndVerify(newTokenPair.refreshToken())).thenReturn(newJws);

        TokenPair result = authService.refreshTokens(oldRefreshToken, ipAddress, userAgent);

        assertThat(result.accessToken()).isEqualTo("new.access.token");
        assertThat(result.refreshToken()).isEqualTo("new.refresh.token");
        verify(refreshTokenRepository).save(argThat(rt -> !rt.isRevoked()));
        verify(refreshTokenRepository).save(argThat(rt -> rt.isRevoked() && rt.getTokenHash().equals(tokenHash)));
    }

    @Test
    void shouldThrowExceptionWhenRefreshTokenIsMissing() {
        assertThatThrownBy(() -> authService.refreshTokens(null, "127.0.0.1", "Mozilla/5.0"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Missing refresh token");

        assertThatThrownBy(() -> authService.refreshTokens("", "127.0.0.1", "Mozilla/5.0"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Missing refresh token");
    }

    @Test
    void shouldThrowExceptionWhenRefreshTokenIsInvalid() {
        String invalidToken = "invalid.token";
        when(jwtService.validateToken(invalidToken, "refresh")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshTokens(invalidToken, "127.0.0.1", "Mozilla/5.0"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid refresh token");
    }

    @Test
    void shouldThrowExceptionWhenRefreshTokenNotFoundInDatabase() {
        String refreshToken = "unknown.token";
        String tokenHash = "unknownHash";

        when(jwtService.validateToken(refreshToken, "refresh")).thenReturn(true);
        when(jwtService.hashRefreshToken(refreshToken)).thenReturn(tokenHash);
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refreshTokens(refreshToken, "127.0.0.1", "Mozilla/5.0"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Refresh token not recognized");
    }

    @Test
    void shouldThrowExceptionWhenRefreshTokenIsRevoked() {
        String revokedToken = "revoked.token";
        String tokenHash = "revokedHash";

        RefreshToken storedToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .userId(userId)
                .revoked(true)
                .build();

        when(jwtService.validateToken(revokedToken, "refresh")).thenReturn(true);
        when(jwtService.hashRefreshToken(revokedToken)).thenReturn(tokenHash);
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(storedToken));

        assertThatThrownBy(() -> authService.refreshTokens(revokedToken, "127.0.0.1", "Mozilla/5.0"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Refresh token revoked");
    }

    @Test
    void shouldThrowExceptionWhenRefreshTokenIsExpired() {
        String expiredToken = "expired.token";
        String tokenHash = "expiredHash";

        RefreshToken storedToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .userId(userId)
                .expiresAt(new Date(System.currentTimeMillis() - 86400000))
                .revoked(false)
                .build();

        when(jwtService.validateToken(expiredToken, "refresh")).thenReturn(true);
        when(jwtService.hashRefreshToken(expiredToken)).thenReturn(tokenHash);
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(storedToken));

        assertThatThrownBy(() -> authService.refreshTokens(expiredToken, "127.0.0.1", "Mozilla/5.0"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Refresh token expired");

        verify(refreshTokenRepository).save(argThat(RefreshToken::isRevoked));
    }

    @Test
    void shouldReturnDefaultRoles() {
        List<String> roles = authService.defaultRoles();

        assertThat(roles)
                .hasSize(1)
                .containsExactly("ROLE_USER");
    }
}
