package com.alpeerkaraca.fintrackserver.dto;

public record TokenPair(
        String accessToken,
        String refreshToken
) {
}
