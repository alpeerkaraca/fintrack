package com.alpeerkaraca.fintrackserver.strategy.investments;

import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.model.AssetType;

import java.math.BigDecimal;

public interface PriceStrategy {
    InvestmentExternalDto fetchInfo(String symbol);
    boolean supports(AssetType type);
}
