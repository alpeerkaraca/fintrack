package com.alpeerkaraca.fintrackserver.dto.frontend;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

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
public class InvestmentCreateRequest {
    @NotBlank
    @Size(min = 1, max = 50)
    private String symbol;

    @NotNull
    @Min(value = 0, message = "quantity must be non-negative")
    private BigDecimal quantity;

    @NotNull
    @DecimalMin(value = "0.00", message = "avgCostTry must be non-negative")
    @Digits(integer = 20, fraction = 2)
    private BigDecimal avgCostTry;

    @NotNull
    private AssetType assetType;
}