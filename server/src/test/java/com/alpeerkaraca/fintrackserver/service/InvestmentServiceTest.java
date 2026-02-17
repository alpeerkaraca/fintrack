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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvestmentServiceTest {

    @Mock
    private InvestmentAssetRepository assetRepository;

    @Mock
    private PriceService priceService;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private MarketDataService marketDataService;

    @InjectMocks
    private InvestmentService investmentService;

    private UUID testUserId;
    private UUID testAssetId;
    private UserProfile testUser;
    private InvestmentAsset testAsset;
    private InvestmentCreateRequest createRequest;
    private InvestmentUpdateRequest updateRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testAssetId = UUID.randomUUID();

        testUser = UserProfile.builder()
                .id(testUserId)
                .username("testuser")
                .email("test@test.com")
                .build();

        testAsset = InvestmentAsset.builder()
                .id(testAssetId)
                .userProfile(testUser)
                .symbol("AAPL")
                .name("Apple Inc.")
                .quantity(BigDecimal.valueOf(10))
                .avgCostOriginal(BigDecimal.valueOf(1500))
                .purchaseCurrency("USD")
                .totalCostTry(BigDecimal.valueOf(45000))
                .stockMarket(StockMarket.NASDAQ)
                .type(AssetType.STOCK)
                .build();

        createRequest = new InvestmentCreateRequest();
        createRequest.setSymbol("AAPL");
        createRequest.setQuantity(BigDecimal.valueOf(10));
        createRequest.setAvgCost(BigDecimal.valueOf(1500));
        createRequest.setAssetType(AssetType.STOCK);
        createRequest.setStockMarket(StockMarket.NASDAQ);

        updateRequest = new InvestmentUpdateRequest();
        updateRequest.setQuantity(BigDecimal.valueOf(15));
        updateRequest.setAvgCostOriginal(BigDecimal.valueOf(1600));
    }

    @Test
    void shouldGetUserPortfolio() {
        List<InvestmentAsset> assets = Arrays.asList(testAsset);
        when(assetRepository.findByUserProfileId(testUserId)).thenReturn(assets);
        when(priceService.getInfo(any(), anyString())).thenReturn(
                new InvestmentExternalDto("AAPL", BigDecimal.valueOf(2000))
        );
        when(marketDataService.getUsdToTryInfo()).thenReturn(
                new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30))
        );

        List<InvestmentAssetDto> result = investmentService.getUserPortfolio(testUserId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSymbol()).isEqualTo("AAPL");
        verify(assetRepository).findByUserProfileId(testUserId);
    }

    @Test
    void shouldGetEmptyPortfolio() {
        when(assetRepository.findByUserProfileId(testUserId)).thenReturn(Arrays.asList());

        List<InvestmentAssetDto> result = investmentService.getUserPortfolio(testUserId);

        assertThat(result).isEmpty();
    }

    @Test
    void shouldAddInvestment() {
        when(assetRepository.existsByUserProfileIdAndSymbol(testUserId, "AAPL")).thenReturn(false);
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(priceService.getInfo(AssetType.STOCK, "AAPL"))
                .thenReturn(new InvestmentExternalDto("Apple Inc.", BigDecimal.valueOf(2000)));
        when(marketDataService.getUsdToTryInfo())
                .thenReturn(new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30)));
        when(assetRepository.save(any(InvestmentAsset.class))).thenReturn(testAsset);

        InvestmentAssetDto result = investmentService.addInvestment(testUserId, createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getSymbol()).isEqualTo("AAPL");
        verify(assetRepository).save(any(InvestmentAsset.class));
    }

    @Test
    void shouldThrowExceptionWhenAssetAlreadyExists() {
        when(assetRepository.existsByUserProfileIdAndSymbol(testUserId, "AAPL")).thenReturn(true);

        assertThatThrownBy(() -> investmentService.addInvestment(testUserId, createRequest))
                .isInstanceOf(AssetAlreadyExistsException.class)
                .hasMessageContaining("already exists");

        verify(assetRepository, never()).save(any());
        verify(userProfileRepository, never()).findById(any());
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        when(assetRepository.existsByUserProfileIdAndSymbol(testUserId, "AAPL")).thenReturn(false);
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> investmentService.addInvestment(testUserId, createRequest))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("not found");

        verify(assetRepository, never()).save(any());
    }

    @Test
    void shouldUpdateInvestment() {
        when(assetRepository.findByIdAndUserProfileId(testAssetId, testUserId))
                .thenReturn(Optional.of(testAsset));
        when(priceService.getInfo(any(), anyString()))
                .thenReturn(new InvestmentExternalDto("AAPL", BigDecimal.valueOf(2000)));
        when(marketDataService.getUsdToTryInfo())
                .thenReturn(new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30)));

        InvestmentAssetDto result = investmentService.updateInvestment(testUserId, updateRequest, testAssetId);

        assertThat(result).isNotNull();
        assertThat(result.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(15));
        // avgCostTry = totalCostTry / quantity = (15 * 1600 * 30) / 15 = 48000
        assertThat(result.getAvgCostTry()).isEqualByComparingTo(BigDecimal.valueOf(48000));
    }

    @Test
    void shouldUpdateOnlyQuantity() {
        InvestmentUpdateRequest partialUpdate = new InvestmentUpdateRequest();
        partialUpdate.setQuantity(BigDecimal.valueOf(20));

        when(assetRepository.findByIdAndUserProfileId(testAssetId, testUserId))
                .thenReturn(Optional.of(testAsset));
        when(priceService.getInfo(any(), anyString()))
                .thenReturn(new InvestmentExternalDto("AAPL", BigDecimal.valueOf(2000)));
        when(marketDataService.getUsdToTryInfo())
                .thenReturn(new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30)));

        InvestmentAssetDto result = investmentService.updateInvestment(testUserId, partialUpdate, testAssetId);

        assertThat(result.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(20));
        // avgCostTry = totalCostTry / quantity = (20 * 1500 * 30) / 20 = 45000
        assertThat(result.getAvgCostTry()).isEqualByComparingTo(BigDecimal.valueOf(45000));
    }

    @Test
    void shouldThrowExceptionWhenUpdatingNonExistentAsset() {
        when(assetRepository.findByIdAndUserProfileId(testAssetId, testUserId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> investmentService.updateInvestment(testUserId, updateRequest, testAssetId))
                .isInstanceOf(AssetNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void shouldDeleteInvestment() {
        when(assetRepository.findByIdAndUserProfileId(testAssetId, testUserId))
                .thenReturn(Optional.of(testAsset));
        doNothing().when(assetRepository).delete(testAsset);

        assertThatCode(() -> investmentService.deleteInvestment(testUserId, testAssetId))
                .doesNotThrowAnyException();

        verify(assetRepository).delete(testAsset);
    }

    @Test
    void shouldThrowExceptionWhenDeletingNonExistentAsset() {
        when(assetRepository.findByIdAndUserProfileId(testAssetId, testUserId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> investmentService.deleteInvestment(testUserId, testAssetId))
                .isInstanceOf(AssetNotFoundException.class);

        verify(assetRepository, never()).delete(any());
    }

    @Test
    void shouldHandleZeroQuantity() {
        createRequest.setQuantity(BigDecimal.ZERO);
        when(assetRepository.existsByUserProfileIdAndSymbol(testUserId, "AAPL")).thenReturn(false);
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(priceService.getInfo(AssetType.STOCK, "AAPL"))
                .thenReturn(new InvestmentExternalDto("Apple Inc.", BigDecimal.valueOf(2000)));
        when(marketDataService.getUsdToTryInfo())
                .thenReturn(new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30)));
        when(assetRepository.save(any(InvestmentAsset.class))).thenReturn(testAsset);

        InvestmentAssetDto result = investmentService.addInvestment(testUserId, createRequest);

        assertThat(result).isNotNull();
        verify(assetRepository).save(any());
    }

    @Test
    void shouldConvertSymbolToUpperCase() {
        createRequest.setSymbol("aapl");
        when(assetRepository.existsByUserProfileIdAndSymbol(testUserId, "aapl")).thenReturn(false);
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(priceService.getInfo(AssetType.STOCK, "AAPL"))
                .thenReturn(new InvestmentExternalDto("Apple Inc.", BigDecimal.valueOf(2000)));
        when(marketDataService.getUsdToTryInfo())
                .thenReturn(new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30)));
        when(assetRepository.save(any(InvestmentAsset.class))).thenAnswer(invocation -> {
            InvestmentAsset saved = invocation.getArgument(0);
            assertThat(saved.getSymbol()).isEqualTo("AAPL");
            return saved;
        });

        investmentService.addInvestment(testUserId, createRequest);

        verify(assetRepository).save(argThat(asset -> asset.getSymbol().equals("AAPL")));
    }

    @Test
    void shouldHandleDifferentAssetTypes() {
        createRequest.setAssetType(AssetType.FUND);
        createRequest.setSymbol("TRF");
        createRequest.setStockMarket(StockMarket.TEFAS);
        
        when(assetRepository.existsByUserProfileIdAndSymbol(testUserId, "TRF")).thenReturn(false);
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(priceService.getInfo(AssetType.FUND, "TRF"))
                .thenReturn(new InvestmentExternalDto("Turkey Fund", BigDecimal.valueOf(10)));
        when(marketDataService.getUsdToTryInfo())
                .thenReturn(new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30)));
        when(assetRepository.save(any(InvestmentAsset.class))).thenReturn(testAsset);

        InvestmentAssetDto result = investmentService.addInvestment(testUserId, createRequest);

        assertThat(result).isNotNull();
        verify(priceService).getInfo(AssetType.FUND, "TRF");
    }

    @Test
    void shouldCalculateProfitCorrectly() {
        when(assetRepository.findByUserProfileId(testUserId)).thenReturn(Arrays.asList(testAsset));
        when(priceService.getInfo(AssetType.STOCK, "AAPL"))
                .thenReturn(new InvestmentExternalDto("Apple Inc.", BigDecimal.valueOf(2000)));
        when(marketDataService.getUsdToTryInfo())
                .thenReturn(new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30)));

        List<InvestmentAssetDto> result = investmentService.getUserPortfolio(testUserId);

        assertThat(result.get(0).getProfitLossTry()).isNotNull();
        assertThat(result.get(0).getCurrentPriceTry()).isNotNull();
    }

    @Test
    void shouldHandleNullUpdateFields() {
        InvestmentUpdateRequest emptyUpdate = new InvestmentUpdateRequest();
        
        when(assetRepository.findByIdAndUserProfileId(testAssetId, testUserId))
                .thenReturn(Optional.of(testAsset));
        when(priceService.getInfo(any(), anyString()))
                .thenReturn(new InvestmentExternalDto("AAPL", BigDecimal.valueOf(2000)));
        when(marketDataService.getUsdToTryInfo())
                .thenReturn(new InvestmentExternalDto("USD/TRY", BigDecimal.valueOf(30)));

        InvestmentAssetDto result = investmentService.updateInvestment(testUserId, emptyUpdate, testAssetId);

        assertThat(result.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(10));
        // avgCostTry = totalCostTry / quantity = 45000 / 10 = 4500
        assertThat(result.getAvgCostTry()).isEqualByComparingTo(BigDecimal.valueOf(4500));
    }
}
