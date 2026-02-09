package com.alpeerkaraca.fintrackserver.dto;

import java.math.BigDecimal;

public record ForecastResponse(
        String month,
        String label,
        BigDecimal savings) {
}
