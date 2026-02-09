package com.alpeerkaraca.fintrackserver.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryDto {
    private BigDecimal income;
    private BigDecimal expense;
    private BigDecimal savings;
    private BigDecimal creditCardLimit;
}
