package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.AuthResult;
import com.alpeerkaraca.fintrackserver.dto.LoginRequest;
import com.alpeerkaraca.fintrackserver.dto.TokenPair;
import com.alpeerkaraca.fintrackserver.security.AuthCookies;
import com.alpeerkaraca.fintrackserver.security.JwtService;
import com.alpeerkaraca.fintrackserver.service.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    private AuthResult testAuthResult;
    private TokenPair testTokenPair;

    @BeforeEach
    void setUp() {
        testAuthResult = new AuthResult(
                UUID.randomUUID(),
                "alpeerkaraca",
                "test@example.com",
                BigDecimal.valueOf(5000)
        );
        testTokenPair = new TokenPair("access.jwt.token", "refresh.jwt.token");
    }

    @Test
    @DisplayName("Should successfully login and return secure cookies")
    void shouldLoginAndReturnCookies() throws Exception {
        LoginRequest request = new LoginRequest("alpeerkaraca", "password123");

        // AuthService otomata bağlanıyor
        when(authService.loginUser(any(LoginRequest.class))).thenReturn(testAuthResult);
        when(authService.defaultRoles()).thenReturn(List.of("ROLE_USER"));
        when(authService.issueTokensForUser(any(), anyString(), anyString(), anyList(), anyString(), any()))
                .thenReturn(testTokenPair);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("User-Agent", "Test-Agent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("alpeerkaraca"))
                // Cookie kontrolleri
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(cookie().value(AuthCookies.ACCESS_COOKIE, "access.jwt.token"))
                .andExpect(cookie().httpOnly(AuthCookies.ACCESS_COOKIE, true))
                .andExpect(cookie().secure(AuthCookies.ACCESS_COOKIE, true))
                .andExpect(cookie().value(AuthCookies.REFRESH_COOKIE, "refresh.jwt.token"))
                .andExpect(cookie().path(AuthCookies.REFRESH_COOKIE, "/api/v1/auth/refresh"));
    }

    @Test
    @DisplayName("Should successfully refresh tokens using refresh cookie")
    void shouldRefreshTokens() throws Exception {
        Cookie refreshCookie = new Cookie(AuthCookies.REFRESH_COOKIE, "old.refresh.token");

        when(authService.refreshTokens(anyString(), anyString(), any()))
                .thenReturn(testTokenPair);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(cookie().value(AuthCookies.ACCESS_COOKIE, "access.jwt.token"))
                .andExpect(cookie().value(AuthCookies.REFRESH_COOKIE, "refresh.jwt.token"));
    }

    @Test
    @DisplayName("Should clear cookies on logout")
    void shouldClearCookiesOnLogout() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(cookie().maxAge(AuthCookies.ACCESS_COOKIE, 0))
                .andExpect(cookie().maxAge(AuthCookies.REFRESH_COOKIE, 0));
    }
}