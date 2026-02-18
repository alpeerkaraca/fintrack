package com.alpeerkaraca.fintrackserver.dto;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.StockMarket;
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
public class InvestmentAssetDto {
    @NotBlank
    private UUID id;
    @NotBlank
    @Size(min = 1, max = 12)
    private String symbol;

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotNull
    @Min(value = 0, message = "quantity must be non-negative")
    private BigDecimal quantity;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true, message = "avgCostTry must be non-negative")
    @Digits(integer = 20, fraction = 6)
    private BigDecimal avgCostTry;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true, message = "currentPriceTry must be non-negative")
    @Digits(integer = 20, fraction = 6)
    private BigDecimal currentPriceTry;

    @NotNull
    @Digits(integer = 6, fraction = 6, message = "changePercent must have up to 4 decimal places")
    private BigDecimal changePercent;

    @NotNull
    @Digits(integer = 20, fraction = 6)
    private BigDecimal profitLossTry;

    @NotNull
    private AssetType assetType;

    private StockMarket stockMarket;

    private String stockMarketDisplayName;
    private String originalCurrency;
    private BigDecimal avgCostOriginal;
    private BigDecimal currentPriceOriginal;
}