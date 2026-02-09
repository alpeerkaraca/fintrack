package com.alpeerkaraca.fintrackserver.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentAssetDto {
    @NotBlank
    @Size(max = 50)
    private String symbol;

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotNull
    @Min(value = 0, message = "quantity must be non-negative")
    private Integer quantity;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true, message = "avgCostTry must be non-negative")
    @Digits(integer = 20, fraction = 2)
    private BigDecimal avgCostTry;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true, message = "currentPriceTry must be non-negative")
    @Digits(integer = 20, fraction = 2)
    private BigDecimal currentPriceTry;

    @NotNull
    @Digits(integer = 6, fraction = 4, message = "changePercent must have up to 4 decimal places")
    private BigDecimal changePercent;

    @NotNull
    @Digits(integer = 20, fraction = 2)
    private BigDecimal profitLossTry;
}