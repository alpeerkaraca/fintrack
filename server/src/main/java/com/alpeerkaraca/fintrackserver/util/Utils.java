package com.alpeerkaraca.fintrackserver.util;

import jakarta.servlet.http.HttpServletRequest;

public class Utils {
    public static String getCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) return null;
        for (var cookie : request.getCookies()) {
            if (cookie.getName().equals(cookieName)) {
                return cookie.getValue();
            }
        }
        return null;
    }

}
