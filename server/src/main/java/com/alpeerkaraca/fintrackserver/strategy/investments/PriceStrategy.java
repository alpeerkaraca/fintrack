package com.alpeerkaraca.fintrackserver.strategy.investments;

import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.InvestmentAsset;
import com.alpeerkaraca.fintrackserver.model.StockMarket;

import java.math.BigDecimal;

public interface PriceStrategy {
    InvestmentExternalDto fetchInfo(String symbol, StockMarket market);
    boolean supports(AssetType type);
}
