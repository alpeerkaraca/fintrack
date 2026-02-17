package com.alpeerkaraca.fintrackserver.dto.frontend;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.StockMarket;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
    @Digits(integer = 20, fraction = 4)
    private BigDecimal avgCost;

    @NotNull
    private AssetType assetType;

    private StockMarket stockMarket;

}