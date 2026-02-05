package com.alpeerkaraca.fintrackserver.DTO;

public record TokenPair(
        String accessToken,
        String refreshToken
) {
}
