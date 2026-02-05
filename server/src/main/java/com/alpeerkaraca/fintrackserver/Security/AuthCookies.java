package com.alpeerkaraca.fintrackserver.Security;

import org.springframework.http.ResponseCookie;

public final class AuthCookies {
    private AuthCookies() {}

    public static final String ACCESS_COOKIE = "access_token";
    public static final String REFRESH_COOKIE = "refresh_token";

    // Tune these:
    public static final String COOKIE_DOMAIN = null; // e.g. ".example.com" in prod, or null for host-only
    public static final boolean SECURE = true;       // true in prod (HTTPS). For localhost dev over http -> false.
    public static final String SAME_SITE = "None";   // "Lax" if same-site; "None" if cross-site.
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
                .path(REFRESH_PATH) // only sent to refresh endpoint
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
