package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.MarketAssetType;
import com.alpeerkaraca.fintrackserver.model.StockMarket;
import com.alpeerkaraca.fintrackserver.strategy.investments.PriceStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class PriceServiceTest {

    @Mock
    private PriceStrategy stockStrategy;

    @Mock
    private PriceStrategy fundStrategy;

    @Mock
    private PriceStrategy metalStrategy;

    private PriceService priceService;

    private List<PriceStrategy> strategies;

    @BeforeEach
    void setUp() {
        strategies = Arrays.asList(stockStrategy, fundStrategy, metalStrategy);
        priceService = new PriceService(strategies);
    }

    @Test
    void shouldGetStockInfo() {
        when(stockStrategy.supports(AssetType.STOCK)).thenReturn(true);
        when(stockStrategy.fetchInfo("AAPL", StockMarket.NASDAQ))
                .thenReturn(new InvestmentExternalDto("Apple Inc.", BigDecimal.valueOf(2000)));

        InvestmentExternalDto result = priceService.getInfo(AssetType.STOCK, "AAPL", StockMarket.NASDAQ);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Apple Inc.");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(2000));
        verify(stockStrategy).fetchInfo("AAPL", StockMarket.NASDAQ);
    }

    @Test
    void shouldGetFundInfo() {
        when(fundStrategy.supports(AssetType.FUND)).thenReturn(true);
        when(fundStrategy.fetchInfo("TRF", StockMarket.TEFAS))
                .thenReturn(new InvestmentExternalDto("Turkey Fund", BigDecimal.valueOf(10.5)));

        InvestmentExternalDto result = priceService.getInfo(AssetType.FUND, "TRF", StockMarket.TEFAS);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Turkey Fund");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(10.5));
        verify(fundStrategy).fetchInfo("TRF", StockMarket.TEFAS);
    }

    @Test
    void shouldGetMetalInfo() {
        when(metalStrategy.supports(AssetType.GOLD_SILVER)).thenReturn(true);
        when(metalStrategy.fetchInfo("altin/gram-altin", null))
                .thenReturn(new InvestmentExternalDto("Altın", BigDecimal.valueOf(3500)));

        InvestmentExternalDto result = priceService.getInfo(AssetType.GOLD_SILVER, "altin/gram-altin", null);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Altın");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(3500));
        verify(metalStrategy).fetchInfo("altin/gram-altin", null);
    }

    @Test
    void shouldThrowExceptionWhenNoStrategySupportsAssetType() {
        when(stockStrategy.supports(any())).thenReturn(false);
        when(fundStrategy.supports(any())).thenReturn(false);
        when(metalStrategy.supports(any())).thenReturn(false);

        assertThatThrownBy(() -> priceService.getInfo(AssetType.STOCK, "UNKNOWN", StockMarket.NASDAQ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported asset type");
    }

    @Test
    void shouldUseFirstMatchingStrategy() {
        when(stockStrategy.supports(AssetType.STOCK)).thenReturn(true);
        when(stockStrategy.fetchInfo("AAPL", StockMarket.NASDAQ))
                .thenReturn(new InvestmentExternalDto("Apple", BigDecimal.valueOf(2000)));

        priceService.getInfo(AssetType.STOCK, "AAPL", StockMarket.NASDAQ);

        verify(stockStrategy).fetchInfo("AAPL", StockMarket.NASDAQ);
        verify(fundStrategy, never()).fetchInfo(anyString(), any());
    }

    @Test
    void shouldHandleDifferentSymbols() {
        when(stockStrategy.supports(AssetType.STOCK)).thenReturn(true);
        when(stockStrategy.fetchInfo("GOOGL", StockMarket.NASDAQ))
                .thenReturn(new InvestmentExternalDto("Alphabet Inc.", BigDecimal.valueOf(3000)));

        InvestmentExternalDto result = priceService.getInfo(AssetType.STOCK, "GOOGL", StockMarket.NASDAQ);

        assertThat(result.name()).isEqualTo("Alphabet Inc.");
        verify(stockStrategy).fetchInfo("GOOGL", StockMarket.NASDAQ);
    }

    @Test
    void shouldHandleEmptyStrategyList() {
        PriceService emptyService = new PriceService(Collections.emptyList());

        assertThatThrownBy(() -> emptyService.getInfo(AssetType.STOCK, "AAPL", StockMarket.NASDAQ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported asset type");
    }

    @Test
    void shouldPassCorrectParametersToStrategy() {
        when(fundStrategy.supports(AssetType.FUND)).thenReturn(true);
        when(fundStrategy.fetchInfo("ABC123", StockMarket.TEFAS))
                .thenReturn(new InvestmentExternalDto("Fund ABC", BigDecimal.TEN));

        priceService.getInfo(AssetType.FUND, "ABC123", StockMarket.TEFAS);

        verify(fundStrategy).supports(AssetType.FUND);
        verify(fundStrategy).fetchInfo("ABC123", StockMarket.TEFAS);
    }

    @Test
    void shouldHandleZeroPrice() {
        when(metalStrategy.supports(AssetType.GOLD_SILVER)).thenReturn(true);
        when(metalStrategy.fetchInfo("emtia/gram-gumus", null))
                .thenReturn(new InvestmentExternalDto("Silver", BigDecimal.ZERO));

        InvestmentExternalDto result = priceService.getInfo(AssetType.GOLD_SILVER, "emtia/gram-gumus", null);

        assertThat(result.price()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleLargePrice() {
        when(stockStrategy.supports(AssetType.STOCK)).thenReturn(true);
        when(stockStrategy.fetchInfo("BRK.A", StockMarket.NYSE))
                .thenReturn(new InvestmentExternalDto("Berkshire Hathaway", new BigDecimal("500000")));

        InvestmentExternalDto result = priceService.getInfo(AssetType.STOCK, "BRK.A", StockMarket.NYSE);

        assertThat(result.price()).isEqualByComparingTo(new BigDecimal("500000"));
    }

    @Test
    void shouldHandlePreciseDecimalPrice() {
        when(fundStrategy.supports(AssetType.FUND)).thenReturn(true);
        when(fundStrategy.fetchInfo("XYZ", StockMarket.TEFAS))
                .thenReturn(new InvestmentExternalDto("XYZ Fund", new BigDecimal("12.3456789")));

        InvestmentExternalDto result = priceService.getInfo(AssetType.FUND, "XYZ", StockMarket.TEFAS);

        assertThat(result.price()).isEqualByComparingTo(new BigDecimal("12.3456789"));
    }

    @Test
    void shouldCheckAllStrategiesUntilMatch() {
        when(stockStrategy.supports(AssetType.GOLD_SILVER)).thenReturn(false);
        when(fundStrategy.supports(AssetType.GOLD_SILVER)).thenReturn(false);
        when(metalStrategy.supports(AssetType.GOLD_SILVER)).thenReturn(true);
        when(metalStrategy.fetchInfo(MarketAssetType.GRAM_ALTIN.getSlug(), null))
                .thenReturn(new InvestmentExternalDto("Gold", BigDecimal.valueOf(3500)));

        priceService.getInfo(AssetType.GOLD_SILVER, MarketAssetType.GRAM_ALTIN.getSlug(), null);

        verify(stockStrategy).supports(AssetType.GOLD_SILVER);
        verify(fundStrategy).supports(AssetType.GOLD_SILVER);
        verify(metalStrategy).supports(AssetType.GOLD_SILVER);
        verify(metalStrategy).fetchInfo(MarketAssetType.GRAM_ALTIN.getSlug(), null);

    }

    @Test
    void shouldNotCallFetchOnNonMatchingStrategies() {
        when(fundStrategy.supports(AssetType.FUND)).thenReturn(true);
        when(fundStrategy.fetchInfo(anyString(), any()))
                .thenReturn(new InvestmentExternalDto("Fund", BigDecimal.TEN));

        priceService.getInfo(AssetType.FUND, "TEST", StockMarket.TEFAS);

        verify(stockStrategy, never()).fetchInfo(anyString(), any());
        verify(fundStrategy).fetchInfo("TEST", StockMarket.TEFAS);
    }
}
