package com.alpeerkaraca.fintrackserver.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SavingsGoalDto(
        UUID id,
        String title,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        String currency,
        LocalDate targetDate,
        Double progressPercent
) {
}
