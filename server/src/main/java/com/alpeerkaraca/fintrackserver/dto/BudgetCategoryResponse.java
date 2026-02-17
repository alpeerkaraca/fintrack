package com.alpeerkaraca.fintrackserver.dto;

import com.alpeerkaraca.fintrackserver.model.Category;
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
    Category category;
    BigDecimal limitTry;
    BigDecimal spentTry;
    String alertLevel;
}
