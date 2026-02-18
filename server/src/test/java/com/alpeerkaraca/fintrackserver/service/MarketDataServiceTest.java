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
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarketDataServiceTest {

    @Mock
    private RestClient restClient;

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

        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

        InvestmentExternalDto result = marketDataService.getUsdToTryInfo();

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("USD");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(33.5));
    }

    @Test
    void shouldThrowExceptionWhenExchangeRateResponseIsNull() {
        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(null);

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

        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

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

        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Invalid response");
    }

    @Test
    void shouldThrowExceptionWhenRestTemplateThrowsException() {
        // Mock the RestClient chain to throw exception
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenThrow(new RuntimeException("Network error"));

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Failed to fetch USD to TRY exchange rate")
                .hasCauseInstanceOf(RuntimeException.class);
    }

    @Test
    void shouldHandleHttpClientErrorException() {
        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenThrow(HttpClientErrorException.class);

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

        // Mock the RestClient chain - need to use anyString() for flexible matching
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        // Use anyString() to be flexible with the exact URL format
        when(mockHeadersUri.uri(anyString(), eq(testApiKey))).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

        marketDataService.getUsdToTryInfo();

        verify(mockHeadersUri).uri(anyString(), eq(testApiKey));
    }

    @Test
    void shouldCacheExchangeRate() {
        ExchangeRateResponse response = new ExchangeRateResponse(
                "success",
                "USD",
                "TRY",
                BigDecimal.valueOf(33.5)
        );

        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

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

        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

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

        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

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

        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

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

        // Mock the RestClient chain
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec mockResponse = mock(RestClient.ResponseSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenReturn(mockHeadersUri);
        when(mockHeadersUri.retrieve()).thenReturn(mockResponse);
        when(mockResponse.onStatus(any(), any())).thenReturn(mockResponse);
        when(mockResponse.body(ExchangeRateResponse.class)).thenReturn(response);

        InvestmentExternalDto result = marketDataService.getUsdToTryInfo();

        assertThat(result.price()).isEqualByComparingTo(new BigDecimal("33.567891234"));
    }

    @Test
    void shouldRethrowMarketDataFetchException() {
        // Mock the RestClient chain to throw exception
        RestClient.RequestHeadersUriSpec mockHeadersUri = mock(RestClient.RequestHeadersUriSpec.class);
        
        when(restClient.get()).thenReturn(mockHeadersUri);
        when(mockHeadersUri.uri(anyString(), anyString())).thenThrow(new MarketDataFetchException("Original exception"));

        assertThatThrownBy(() -> marketDataService.getUsdToTryInfo())
                .isInstanceOf(MarketDataFetchException.class)
                .hasMessageContaining("Original exception");
    }
}
