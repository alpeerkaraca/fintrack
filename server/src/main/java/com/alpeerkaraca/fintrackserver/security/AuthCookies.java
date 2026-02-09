package com.alpeerkaraca.fintrackserver.security;

import org.springframework.http.ResponseCookie;

public final class AuthCookies {
    private AuthCookies() {}

    public static final String ACCESS_COOKIE = "access_token";
    public static final String REFRESH_COOKIE = "refresh_token";

    public static final String COOKIE_DOMAIN = null;
    public static final boolean SECURE = true;
    public static final String SAME_SITE = "None";
    public static final String ACCESS_PATH = "/";
    public static final String REFRESH_PATH = "/api/v1/auth/refresh";

    public static ResponseCookie accessCookie(String jwt, long maxAgeSeconds) {
        var b = ResponseCookie.from(ACCESS_COOKIE, jwt)
                .httpOnly(true)
                .secure(SECURE)
                .path(ACCESS_PATH)
                .sameSite(SAME_SITE)
                .maxAge(maxAgeSeconds);
        if (COOKIE_DOMAIN != null) b = b.domain(COOKIE_DOMAIN);
        return b.build();
    }

    public static ResponseCookie refreshCookie(String jwt, long maxAgeSeconds) {
        var b = ResponseCookie.from(REFRESH_COOKIE, jwt)
                .httpOnly(true)
                .secure(SECURE)
                .path(REFRESH_PATH)
                .sameSite(SAME_SITE)
                .maxAge(maxAgeSeconds);
        if (COOKIE_DOMAIN != null) b = b.domain(COOKIE_DOMAIN);
        return b.build();
    }

    public static ResponseCookie clearAccessCookie() {
        var b = ResponseCookie.from(ACCESS_COOKIE, "")
                .httpOnly(true)
                .secure(SECURE)
                .path(ACCESS_PATH)
                .sameSite(SAME_SITE)
                .maxAge(0);
        if (COOKIE_DOMAIN != null) b = b.domain(COOKIE_DOMAIN);
        return b.build();
    }

    public static ResponseCookie clearRefreshCookie() {
        var b = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(SECURE)
                .path(REFRESH_PATH)
                .sameSite(SAME_SITE)
                .maxAge(0);
        if (COOKIE_DOMAIN != null) b = b.domain(COOKIE_DOMAIN);
        return b.build();
    }
}
