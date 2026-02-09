package com.alpeerkaraca.fintrackserver.dto;

import com.alpeerkaraca.fintrackserver.model.BudgetCategory;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetMonthDto {
    @NotBlank
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "month must be in yyyy-MM format")
    private String month;

    @NotBlank
    @Size(max = 255)
    private String label;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true, message = "incomeTry must be non-negative")
    @Digits(integer = 20, fraction = 2)
    private BigDecimal incomeTry;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true, message = "expenseTry must be non-negative")
    @Digits(integer = 20, fraction = 2)
    private BigDecimal expenseTry;

    @NotNull
    @Digits(integer = 20, fraction = 2)
    private BigDecimal netSavingsTry;

    @NotNull
    private List<BudgetCategory> categories;

    @AssertTrue(message = "netSavingsTry must equal incomeTry - expenseTry when all values are provided")
    private boolean isNetSavingsConsistent() {
        if (incomeTry == null || expenseTry == null || netSavingsTry == null) {
            return true;
        }
        BigDecimal computed = incomeTry.subtract(expenseTry).setScale(2, RoundingMode.HALF_UP);
        BigDecimal actual = netSavingsTry.setScale(2, RoundingMode.HALF_UP);
        return actual.compareTo(computed) == 0;
    }
}