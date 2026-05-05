package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import com.alpeerkaraca.fintrackserver.dto.AuthResult;
import com.alpeerkaraca.fintrackserver.dto.LoginRequest;
import com.alpeerkaraca.fintrackserver.dto.RegisterRequest;
import com.alpeerkaraca.fintrackserver.dto.TokenPair;
import com.alpeerkaraca.fintrackserver.security.AuthCookies;
import com.alpeerkaraca.fintrackserver.service.AuthService;
import com.alpeerkaraca.fintrackserver.util.Utils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RequestMapping("/api/v1/auth")
@RestController
@RequiredArgsConstructor
public class AuthController {

    @Value("${app.jwt.expiration-sec}")
    private long accessTokenExpirationSec;
    @Value("${app.jwt.refresh-expiration-sec}")
    private long refreshTokenExpirationSec;

    private final AuthService authService;
    private final com.alpeerkaraca.fintrackserver.service.RateLimitingService rateLimitingService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResult>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        String ip = http.getRemoteAddr();
        if(!rateLimitingService.isAllowed("login", ip)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts");
        }
        
        AuthResult user = authService.loginUser(request);
        rateLimitingService.reset("login", ip);

        return getAuthResultResponseEntity(http, user);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResult>> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        String ip = http.getRemoteAddr();
        if(!rateLimitingService.isAllowed("register", ip)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many registration attempts");
        }
        
        AuthResult user = authService.registerUser(request);
        rateLimitingService.reset("register", ip);

        return getAuthResultResponseEntity(http, user);
    }

    @NonNull
    private ResponseEntity<ApiResponse<AuthResult>> getAuthResultResponseEntity(HttpServletRequest http, AuthResult user) {
        String ip = http.getRemoteAddr();
        String ua = http.getHeader("User-Agent");

        TokenPair pair = authService.issueTokensForUser(
                user.id(), user.email(), user.username(),
                authService.defaultRoles(),
                ip, ua
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.accessCookie(pair.accessToken(), accessTokenExpirationSec).toString())
                .header(HttpHeaders.SET_COOKIE, AuthCookies.refreshCookie(pair.refreshToken(), refreshTokenExpirationSec).toString())
                .body(ApiResponse.success("Authentication successful", user));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refresh(HttpServletRequest request) {
        String refreshToken = Utils.getCookie(request, "refresh_token");

        String ip = request.getRemoteAddr();
        String ua = request.getHeader("User-Agent");
        TokenPair pair = authService.refreshTokens(refreshToken, ip, ua);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.accessCookie(pair.accessToken(), accessTokenExpirationSec).toString())
                .header(HttpHeaders.SET_COOKIE, AuthCookies.refreshCookie(pair.refreshToken(), refreshTokenExpirationSec).toString())
                .body(ApiResponse.success("Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.clearAccessCookie().toString())
                .header(HttpHeaders.SET_COOKIE, AuthCookies.clearRefreshCookie().toString())
                .body(ApiResponse.success("Logged out successfully"));
    }

    @GetMapping("/csrf")
    public ResponseEntity<ApiResponse<Void>> getCsrfToken() {
        return ResponseEntity.ok(ApiResponse.success("CSRF token generated"));
    }
}
