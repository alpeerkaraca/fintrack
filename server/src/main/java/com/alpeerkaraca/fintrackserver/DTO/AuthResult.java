package com.alpeerkaraca.fintrackserver.DTO;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Builder
public record AuthResult(
        UUID id,
        String username,
        String email,
        BigDecimal netSalaryUsd) {
}
