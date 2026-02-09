package com.alpeerkaraca.fintrackserver.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;
@Builder
public record AuthResult(
        UUID id,
        String username,
        String email,
        BigDecimal netSalaryUsd) {
}
