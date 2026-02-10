package com.alpeerkaraca.fintrackserver.strategy.investments;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class FundPriceStrategy implements PriceStrategy{
    private final MarketDataService marketDataService;

    @Override
    public BigDecimal fetchPrice(String symbol) {
        return marketDataService.getFundPrice(symbol);
    }

    @Override
    public boolean supports(AssetType type) {
        return type == AssetType.FUND;
    }
}
