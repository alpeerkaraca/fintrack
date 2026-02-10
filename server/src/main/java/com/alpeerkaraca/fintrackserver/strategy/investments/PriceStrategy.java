package com.alpeerkaraca.fintrackserver.strategy.investments;

import com.alpeerkaraca.fintrackserver.model.AssetType;

import java.math.BigDecimal;

public interface PriceStrategy {
    BigDecimal fetchPrice(String symbol);
    boolean supports(AssetType type);
}
