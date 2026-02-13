package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.ExchangeRateResponse;
import com.alpeerkaraca.fintrackserver.dto.FundResponse;
import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.exception.MarketDataFetchException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarketDataServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private MarketDataService marketDataService;

    private String testApiKey = "test-api-key-12345";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(marketDataService, "exchangeApiKey", testApiKey);
    }

    @Test
    void shouldGetUsdToTryInfo() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                BigDecimal.valueOf(33.5)
        );

        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        InvestmentExternalDto result = marketDataService.getUsdToTryInfo();

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("USD");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(33.5));
        verify(restTemplate).getForObject(anyString(), eq(ExchangeRateResponse.class));
    }

    @Test
    void shouldThrowExceptionWhenExchangeRateResponseIsNull() {
        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(null);

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Invalid response");
    }

    @Test
    void shouldThrowExceptionWhenExchangeRateResultIsNotSuccess() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "error",
                "USD",
                "TRY",
                null
        );

        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Invalid response");
    }

    @Test
    void shouldThrowExceptionWhenConversionRateIsNull() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                null
        );

        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Invalid response");
    }

    @Test
    void shouldThrowExceptionWhenRestTemplateThrowsException() {
        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenThrow(new RuntimeException("Network error"));

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Failed to fetch USD to TRY exchange rate")
                .hasCauseInstanceOf(RuntimeException.class);
    }

    @Test
    void shouldHandleHttpClientErrorException() {
        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenThrow(HttpClientErrorException.class);

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Failed to fetch");
    }

    @Test
    void shouldUseCorrectApiKeyInUrl() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                BigDecimal.valueOf(33.5)
        );

        when(restTemplate.getForObject(contains(testApiKey), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        marketDataService.getUsdToTryInfo();

        verify(restTemplate).getForObject(contains(testApiKey), eq(ExchangeRateResponse.class));
    }

    @Test
    void shouldCacheExchangeRate() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                BigDecimal.valueOf(33.5)
        );

        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        InvestmentExternalDto result1 = marketDataService.getUsdToTryInfo();
        InvestmentExternalDto result2 = marketDataService.getUsdToTryInfo();

        assertThat(result1).isNotNull();
        assertThat(result2).isNotNull();
    }

    @Test
    void shouldHandleDifferentExchangeRates() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                BigDecimal.valueOf(40.25)
        );

        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        InvestmentExternalDto result = marketDataService.getUsdToTryInfo();

        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(40.25));
    }

    @Test
    void shouldHandleZeroExchangeRate() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                BigDecimal.ZERO
        );

        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        InvestmentExternalDto result = marketDataService.getUsdToTryInfo();

        assertThat(result.price()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleVeryLargeExchangeRate() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                new BigDecimal("999999.99")
        );

        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        InvestmentExternalDto result = marketDataService.getUsdToTryInfo();

        assertThat(result.price()).isEqualByComparingTo(new BigDecimal("999999.99"));
    }

    @Test
    void shouldHandlePreciseDecimalExchangeRate() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                new BigDecimal("33.567891234")
        );

        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenReturn(response);

        InvestmentExternalDto result = marketDataService.getUsdToTryInfo();

        assertThat(result.price()).isEqualByComparingTo(new BigDecimal("33.567891234"));
    }

    @Test
    void shouldRethrowMarketDataFetchException() {
        when(restTemplate.getForObject(anyString(), eq(ExchangeRateResponse.class)))
                .thenThrow(new MarketDataFetchException("Original exception"));

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Original exception");
    }
}
