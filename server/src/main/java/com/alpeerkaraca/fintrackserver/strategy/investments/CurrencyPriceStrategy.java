package com.alpeerkaraca.fintrackserver.strategy.investments;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class CurrencyPriceStrategy implements PriceStrategy {
    private final MarketDataService marketDataService;

    @Override
    public BigDecimal fetchPrice(String symbol) {
        return marketDataService.getUsdToTryExchangeRate();

    }

    @Override
    public boolean supports(AssetType type) {
        return type == AssetType.CURRENCY;
    }
}
