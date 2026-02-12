package com.alpeerkaraca.fintrackserver.strategy.investments;

import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FundPriceStrategy implements PriceStrategy{
    private final MarketDataService marketDataService;

    @Override
    public InvestmentExternalDto fetchInfo(String symbol) {
        return marketDataService.getFundInfo(symbol);
    }

    @Override
    public boolean supports(AssetType type) {
        return type == AssetType.FUND;
    }

}
