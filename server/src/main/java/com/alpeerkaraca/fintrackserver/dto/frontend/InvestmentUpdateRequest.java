package com.alpeerkaraca.fintrackserver.dto.frontend;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentUpdateRequest {


    @Min(value = 0, message = "quantity must be non-negative")
    private BigDecimal quantity;

    @DecimalMin(value = "0.00", message = "avgCostTry must be non-negative")
    @Digits(integer = 20, fraction = 4)
    private BigDecimal avgCostTry;

}