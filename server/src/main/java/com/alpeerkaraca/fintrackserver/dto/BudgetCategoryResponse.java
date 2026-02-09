package com.alpeerkaraca.fintrackserver.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BudgetCategoryResponse {
    String category;
    BigDecimal limitTry;
    BigDecimal spentTry;
    String alertLevel;
}
