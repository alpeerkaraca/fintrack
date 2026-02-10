package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.InvestmentAssetDto;
import com.alpeerkaraca.fintrackserver.model.InvestmentAsset;
import com.alpeerkaraca.fintrackserver.repository.InvestmentAssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvestmentService {
    private final InvestmentAssetRepository assetRepository;
    private final PriceService priceService;

    public List<InvestmentAssetDto> getUserPortfolio(UUID userId) {
        List<InvestmentAsset> assets = assetRepository.findByUserProfileId(userId);
        log.info("Fetched {} assets for user {}", assets.size(), userId);
        assets.forEach(asset -> {
            log.info("Asset: {}, {}", asset.getSymbol(), asset.toString());
        });
        return assets.stream().map(asset -> {
            BigDecimal currentPrice = priceService.getPrice(asset.getType(), asset.getSymbol());
            return convertToDto(asset, currentPrice);
        }).toList();
    }

    private InvestmentAssetDto convertToDto(InvestmentAsset asset, BigDecimal currentPrice) {
        return InvestmentAssetDto.builder()
                .symbol(asset.getSymbol())
                .name(asset.getName())
                .quantity(asset.getQuantity())
                .avgCostTry(asset.getAvgCostTry())
                .currentPriceTry(currentPrice)
                .changePercent(asset.getChangePercent())
                .profitLossTry(asset.getProfitLossTry())
                .build();
    }
}
