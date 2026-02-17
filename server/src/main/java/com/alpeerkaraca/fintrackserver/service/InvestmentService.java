package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.InvestmentAssetDto;
import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.dto.frontend.InvestmentCreateRequest;
import com.alpeerkaraca.fintrackserver.dto.frontend.InvestmentUpdateRequest;
import com.alpeerkaraca.fintrackserver.exception.AssetAlreadyExistsException;
import com.alpeerkaraca.fintrackserver.exception.AssetDeleteException;
import com.alpeerkaraca.fintrackserver.exception.AssetNotFoundException;
import com.alpeerkaraca.fintrackserver.exception.UserNotFoundException;
import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.InvestmentAsset;
import com.alpeerkaraca.fintrackserver.model.StockMarket;
import com.alpeerkaraca.fintrackserver.model.UserProfile;
import com.alpeerkaraca.fintrackserver.repository.InvestmentAssetRepository;
import com.alpeerkaraca.fintrackserver.repository.UserProfileRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvestmentService {
    private final InvestmentAssetRepository assetRepository;
    private final PriceService priceService;
    private final UserProfileRepository userProfileRepository;
    private final MarketDataService marketDataService;


    public List<InvestmentAssetDto> getUserPortfolio(UUID userId) {
        List<InvestmentAsset> assets = assetRepository.findByUserProfileId(userId);

        return assets.stream().map(this::convertToDto).toList();
    }

    @Transactional
    public InvestmentAssetDto addInvestment(UUID userId, @Valid InvestmentCreateRequest dto) {
        UserProfile userProfile = userProfileRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("User profile not found for id: " + userId));

        if (assetRepository.existsByUserProfileIdAndSymbol(userId, dto.getSymbol())) {
            throw new AssetAlreadyExistsException("Asset with symbol " + dto.getSymbol() + " already exists in portfolio. Please update the existing asset instead of adding as new one.");
        }
        if (dto.getStockMarket() == null) dto.setStockMarket(StockMarket.OTHER);
        InvestmentExternalDto assetInfo = priceService.getInfo(dto.getAssetType(), dto.getSymbol().toUpperCase());
        
        String purchaseCurrency = dto.getStockMarket().getCurrency();
        BigDecimal rate;
        if ("TRY".equalsIgnoreCase(purchaseCurrency)) {
            rate = BigDecimal.ONE;
        } else if ("USD".equalsIgnoreCase(purchaseCurrency)) {
            rate = marketDataService.getUsdToTryInfo().price();
        } else {
            // For any future currencies, default to USD/TRY rate
            rate = marketDataService.getUsdToTryInfo().price();
        }
        BigDecimal totalCostTry = dto.getAvgCost().multiply(dto.getQuantity()).multiply(rate);

        InvestmentAsset newAsset = InvestmentAsset.builder()
                .userProfile(userProfile)
                .symbol(dto.getAssetType() == AssetType.GOLD_SILVER ? dto.getSymbol().toLowerCase() : dto.getSymbol().toUpperCase())
                .name(assetInfo.name())
                .quantity(dto.getQuantity())
                .avgCostOriginal(dto.getAvgCost())
                .purchaseCurrency(dto.getStockMarket().getCurrency())
                .totalCostTry(totalCostTry)
                .type(dto.getAssetType())
                .stockMarket(dto.getStockMarket())
                .build();
        InvestmentAsset savedAsset = assetRepository.save(newAsset);
        log.info("Added new asset for user {}: {}", userId, savedAsset.getSymbol());
        return convertToDto(savedAsset);

    }

    @Transactional
    public InvestmentAssetDto updateInvestment(UUID userId, @Valid InvestmentUpdateRequest dto, UUID assetId) {
        InvestmentAsset asset = assetRepository.findByIdAndUserProfileId(assetId, userId)
                .orElseThrow(() -> new AssetNotFoundException("Asset not found for id: " + assetId));

        if (dto.getQuantity() != null) {
            asset.setQuantity(dto.getQuantity());
        }
        if (dto.getAvgCostOriginal() != null && dto.getAvgCostOriginal().compareTo(BigDecimal.ZERO) > 0) {
            asset.setAvgCostOriginal(dto.getAvgCostOriginal());
        }

        // Recalculate totalCostTry based on quantity and avgCostOriginal
        String purchaseCurrency = asset.getPurchaseCurrency();
        BigDecimal rate;
        if (purchaseCurrency != null && "TRY".equalsIgnoreCase(purchaseCurrency)) {
            rate = BigDecimal.ONE;
        } else if (purchaseCurrency != null && "USD".equalsIgnoreCase(purchaseCurrency)) {
            rate = marketDataService.getUsdToTryInfo().price();
        } else {
            // For any future currencies or null, default to USD/TRY rate
            rate = marketDataService.getUsdToTryInfo().price();
        }

        asset.setTotalCostTry(asset.getQuantity()
                .multiply(asset.getAvgCostOriginal())
                .multiply(rate));

        log.info("Updated asset {}: New AvgCostOriginal: {}, New TotalCostTry: {}",
                asset.getSymbol(), asset.getAvgCostOriginal(), asset.getTotalCostTry());

        return convertToDto(asset);
    }

    @Transactional
    public void deleteInvestment(UUID userId, UUID assetId) {
        try {
            InvestmentAsset existingInvestment = assetRepository.findByIdAndUserProfileId(assetId, userId)
                    .orElseThrow(() -> new AssetNotFoundException("Asset not found for id: " + assetId));
            assetRepository.delete(existingInvestment);
            log.info("Deleted asset {} for user {}", assetId, userId);
        } catch (AssetNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting asset {} for user {}: {}", assetId, userId, e.getMessage());
            throw new AssetDeleteException("Failed to delete asset. Please try again later.");
        }
    }


    private InvestmentAssetDto convertToDto(InvestmentAsset asset) {
        BigDecimal currentPriceTry = getCurrentPrice(asset);
        BigDecimal currentPriceOriginal;
        if (asset.getStockMarket() != null && asset.getStockMarket().getCurrency().equalsIgnoreCase("TRY")) {
            currentPriceOriginal = currentPriceTry;
        } else {
            currentPriceOriginal = currentPriceTry.divide(marketDataService.getUsdToTryInfo().price(), 2, RoundingMode.HALF_UP);
        }

        BigDecimal totalValue = asset.getQuantity().multiply(currentPriceTry);
        BigDecimal profitLoss = totalValue.subtract(asset.getTotalCostTry());

        BigDecimal changePercent = BigDecimal.ZERO;
        if (asset.getTotalCostTry().compareTo(BigDecimal.ZERO) > 0) {
            changePercent = profitLoss.divide(asset.getTotalCostTry(), 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        
        BigDecimal avgCostTry = BigDecimal.ZERO;
        if (asset.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
            avgCostTry = asset.getTotalCostTry().divide(asset.getQuantity(), 2, RoundingMode.HALF_UP);
        }
        
        String originalCurrency = asset.getStockMarket() != null ? asset.getStockMarket().getCurrency() : "TRY";
        StockMarket stockMarket = asset.getStockMarket() != null ? asset.getStockMarket() : StockMarket.OTHER;
        String stockMarketDisplayName = asset.getStockMarket() != null ? asset.getStockMarket().getLabel() : "Other";
        
        return InvestmentAssetDto.builder()
                .id(asset.getId())
                .symbol(asset.getSymbol())
                .name(asset.getName())
                .quantity(asset.getQuantity())
                .avgCostTry(avgCostTry)
                .currentPriceTry(currentPriceTry)
                .avgCostOriginal(asset.getAvgCostOriginal())
                .currentPriceOriginal(currentPriceOriginal)
                .originalCurrency(originalCurrency)
                .profitLossTry(profitLoss)
                .changePercent(changePercent)
                .assetType(asset.getType())
                .stockMarket(stockMarket)
                .stockMarketDisplayName(stockMarketDisplayName)
                .build();
    }

    private BigDecimal getCurrentPrice(InvestmentAsset asset) {
        try {
            InvestmentExternalDto info = priceService.getInfo(asset.getType(), asset.getSymbol());
            BigDecimal price = info.price();
            if (asset.getStockMarket() != null && "USD".equals(asset.getStockMarket().getCurrency())) {
                BigDecimal usdRate = priceService.getInfo(AssetType.CURRENCY, null).price();
                price = price.multiply(usdRate);
            }
            return price;
        } catch (Exception e) {
            log.warn("Failed to fetch current price for asset {}: {}", asset.getSymbol(), e.getMessage());
            if (asset.getQuantity().compareTo(BigDecimal.ZERO) == 0) {
                return BigDecimal.ZERO;
            }
            return asset.getTotalCostTry().divide(asset.getQuantity(), 2, RoundingMode.HALF_UP);
        }
    }
}
