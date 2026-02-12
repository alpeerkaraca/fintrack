package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.InvestmentAssetDto;
import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.dto.frontend.InvestmentCreateRequest;
import com.alpeerkaraca.fintrackserver.dto.frontend.InvestmentUpdateRequest;
import com.alpeerkaraca.fintrackserver.exception.AssetAlreadyExistsException;
import com.alpeerkaraca.fintrackserver.exception.AssetDeleteException;
import com.alpeerkaraca.fintrackserver.exception.AssetNotFoundException;
import com.alpeerkaraca.fintrackserver.exception.UserNotFoundException;
import com.alpeerkaraca.fintrackserver.model.InvestmentAsset;
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


    public List<InvestmentAssetDto> getUserPortfolio(UUID userId) {
        List<InvestmentAsset> assets = assetRepository.findByUserProfileId(userId);

        return assets.stream().map(this::convertToDto).toList();
    }

    @Transactional
    public InvestmentAssetDto addInvestment(UUID userId, @Valid InvestmentCreateRequest dto) {
        try {
            if (assetRepository.existsByUserProfileIdAndSymbol(userId, dto.getSymbol())) {
                throw new AssetAlreadyExistsException("Asset with symbol " + dto.getSymbol() + " already exists in portfolio. Please update the existing asset instead of adding as new one.");
            }
            UserProfile userProfile = userProfileRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("User profile not found for id: " + userId));

            InvestmentExternalDto assetInfo = priceService.getInfo(dto.getAssetType(), dto.getSymbol());
            InvestmentAsset newAsset = InvestmentAsset.builder()
                    .userProfile(userProfile)
                    .symbol(dto.getSymbol().toUpperCase())
                    .name(assetInfo.name())
                    .quantity(dto.getQuantity())
                    .avgCostTry(dto.getAvgCostTry())
                    .type(dto.getAssetType())
                    .build();
            InvestmentAsset savedAsset = assetRepository.save(newAsset);
            log.info("Added new asset for user {}: {}", userId, savedAsset.toString());
            return convertToDto(savedAsset);
        } catch (AssetAlreadyExistsException e) {
            throw e;
        }
    }

    @Transactional
    public InvestmentAssetDto updateInvestment(UUID userId, @Valid InvestmentUpdateRequest dto, UUID assetId) {
        try {
            InvestmentAsset existingInvestment = assetRepository.findByIdAndUserProfileId(assetId, userId)
                    .orElseThrow(() -> new AssetNotFoundException("Asset not found for id: " + assetId));

            if (dto.getQuantity() != null) {
                existingInvestment.setQuantity(dto.getQuantity());
            }
            if (dto.getAvgCostTry() != null) {
                existingInvestment.setAvgCostTry(dto.getAvgCostTry());
            }

            return convertToDto(existingInvestment);
        } catch (AssetNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating asset for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to update asset. Please try again later.");
        }
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
        BigDecimal currentPrice = getCurrentPrice(asset);
        BigDecimal totalValue = asset.getQuantity().multiply(currentPrice);
        BigDecimal totalCost = asset.getQuantity().multiply(asset.getAvgCostTry());
        BigDecimal profitLoss = totalValue.subtract(totalCost);
        BigDecimal changePercent = BigDecimal.ZERO;
        if (asset.getAvgCostTry().compareTo(BigDecimal.ZERO) > 0) {
            changePercent = profitLoss.divide(totalCost, 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return InvestmentAssetDto.builder()
                .id(asset.getId())
                .symbol(asset.getSymbol())
                .name(asset.getName())
                .quantity(asset.getQuantity())
                .avgCostTry(asset.getAvgCostTry())
                .currentPriceTry(currentPrice)
                .profitLossTry(profitLoss)
                .changePercent(changePercent)
                .assetType(asset.getType())
                .build();
    }

    private BigDecimal getCurrentPrice(InvestmentAsset asset) {
        try {
            return priceService.getInfo(asset.getType(), asset.getSymbol()).price();
        } catch (Exception e) {
            log.warn("Failed to fetch current price for asset {}: {}", asset.getSymbol(), e.getMessage());
            return asset.getAvgCostTry();
        }
    }
}
