package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.strategy.investments.PriceStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PriceService {
    private final List<PriceStrategy> strategies;

    public InvestmentExternalDto getInfo(AssetType type, String symbol) {
        return strategies.stream()
                .filter(s -> s.supports(type))
                .findFirst()
                .map(s -> s.fetchInfo(symbol))
                .orElseThrow(() -> new IllegalArgumentException("Unsupported asset type: " + type));
    }
}
