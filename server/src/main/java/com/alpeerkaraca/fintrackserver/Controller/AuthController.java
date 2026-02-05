package com.alpeerkaraca.fintrackserver.Controller;

import com.alpeerkaraca.fintrackserver.DTO.AuthResult;
import com.alpeerkaraca.fintrackserver.DTO.LoginRequest;
import com.alpeerkaraca.fintrackserver.DTO.RegisterRequest;
import com.alpeerkaraca.fintrackserver.DTO.TokenPair;
import com.alpeerkaraca.fintrackserver.Security.AuthCookies;
import com.alpeerkaraca.fintrackserver.Service.AuthService;
import com.alpeerkaraca.fintrackserver.Util.Utils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api/v1/auth/")
@RestController
@RequiredArgsConstructor
public class AuthController {

    @Value("${app.jwt.expiration}")
    private long ACCESS_TOKEN_EXPIRATION_SEC;
    @Value("${app.jwt.refresh-expiration}")
    private long REFRESH_TOKEN_EXPIRATION_SEC;

    private final AuthService authService;

    @PostMapping("login")
    public ResponseEntity<AuthResult> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        AuthResult user = authService.loginUser(request);

        return getAuthResultResponseEntity(http, user);
    }

    @PostMapping("register")
    public ResponseEntity<AuthResult> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        AuthResult user = authService.registerUser(request);

        return getAuthResultResponseEntity(http, user);
    }

    @NonNull
    private ResponseEntity<AuthResult> getAuthResultResponseEntity(HttpServletRequest http, AuthResult user) {
        String ip = http.getRemoteAddr();
        String ua = http.getHeader("User-Agent");

        TokenPair pair = authService.issueTokensForUser(
                user.id(), user.email(), user.username(),
                authService.defaultRoles(),
                ip, ua
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.accessCookie(pair.accessToken(), ACCESS_TOKEN_EXPIRATION_SEC).toString())
                .header(HttpHeaders.SET_COOKIE, AuthCookies.refreshCookie(pair.refreshToken(), REFRESH_TOKEN_EXPIRATION_SEC).toString())
                .body(user);
    }

    @PostMapping("refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request) {
        String refreshToken = Utils.getCookie(request, "refresh_token");

        String ip = request.getRemoteAddr();
        String ua = request.getHeader("User-Agent");
        TokenPair pair = authService.refreshTokens(refreshToken, ip, ua);

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.accessCookie(pair.accessToken(), ACCESS_TOKEN_EXPIRATION_SEC).toString())
                .header(HttpHeaders.SET_COOKIE, AuthCookies.refreshCookie(pair.refreshToken(), REFRESH_TOKEN_EXPIRATION_SEC).toString())
                .build();
    }

    @PostMapping("logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.clearAccessCookie().toString())
                .header(HttpHeaders.SET_COOKIE, AuthCookies.clearRefreshCookie().toString())
                .build();
    }
}
