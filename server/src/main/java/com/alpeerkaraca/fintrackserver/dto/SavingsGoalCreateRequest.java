package com.alpeerkaraca.fintrackserver.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalCreateRequest(
        String title,
        BigDecimal targetAmount,
        String currency,
        LocalDate targetDate
) {
}
