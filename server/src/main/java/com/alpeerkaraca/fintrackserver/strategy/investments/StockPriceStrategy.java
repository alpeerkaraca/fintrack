package com.alpeerkaraca.fintrackserver.strategy.investments;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class StockPriceStrategy implements PriceStrategy {
    @Override
    public BigDecimal fetchPrice(String symbol) {
        return null;
    }

    @Override
    public boolean supports(AssetType type) {
        return false;
    }
}
