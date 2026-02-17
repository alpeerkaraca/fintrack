package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.ExchangeRateResponse;
import com.alpeerkaraca.fintrackserver.dto.FundResponse;
import com.alpeerkaraca.fintrackserver.dto.InvestmentExternalDto;
import com.alpeerkaraca.fintrackserver.exception.AssetNotFoundException;
import com.alpeerkaraca.fintrackserver.exception.MarketDataFetchException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketDataService {
    private static final String URL = "https://v6.exchangerate-api.com/v6/{API_URL}/pair/USD/TRY";
    private final RestClient restClient;
    @Value("${app.exchange.api-key}")
    private String exchangeApiKey;

    @Cacheable(value = "exchangeRates", key = "'USD_TRY'")
    public InvestmentExternalDto getUsdToTryInfo() {
        try {
            String url = URL.replace("API_URL", exchangeApiKey);
            ExchangeRateResponse response = restClient.get()
                    .uri(URL, exchangeApiKey)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (request, res) -> {
                        throw new RuntimeException("API Key is invalid or has exceeded its usage limits.");
                    })
                    .body(ExchangeRateResponse.class);
            if (response != null
                    && "success".equalsIgnoreCase(response.result())
                    && response.conversion_rate() != null) {
                return new InvestmentExternalDto(response.base_code(), response.conversion_rate());
            }
            throw new MarketDataFetchException("Invalid response from exchange rate API");
        } catch (MarketDataFetchException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching exchange rate: {}", e.getMessage());
            throw new MarketDataFetchException("Failed to fetch USD to TRY exchange rate", e);
        }
    }

    @Cacheable(value = "metalPrices", key = "#metalName.toLowerCase()")
    public InvestmentExternalDto getMetalInfo(String metalName) {
        try {
            String url = "https://bloomberght.com/" + metalName.toLowerCase();
            Document doc = Jsoup
                    .connect(url)
                    .header("Accept", "application/json, text/html")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                    .get();
            Element priceElement = doc
                    .select("[class^=security-] span")
                    .first();
            Element nameElement = doc.selectFirst("h1.font-unna");

            if (priceElement == null || nameElement == null) {
                throw new MarketDataFetchException("Price or name element not found for metal: " + metalName);
            }

            String priceText = priceElement.text().replace(".", "");
            String nameText = nameElement.text();
            return new InvestmentExternalDto(nameText, new BigDecimal(priceText.replace(",", ".")));
        } catch (MarketDataFetchException e) {
            throw e;
        } catch (Exception e) {
            throw new MarketDataFetchException("Failed to fetch metal price for: " + metalName, e);
        }
    }


    @Cacheable(value = "fundPrices", key = "#fundCode.toUpperCase()")
    public InvestmentExternalDto getFundInfo(String fundCode) {
        try {
            String url = "https://api.fundfy.net/api/v1/fund/detail/{fundCode}";
            FundResponse response = restClient.get()
                    .uri(url, fundCode.toUpperCase())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (request, res) -> {
                        throw new AssetNotFoundException("Fund not found for code: " + fundCode);
                    })
                    .body(FundResponse.class);

            if (response == null || response.price() == null) {
                throw new MarketDataFetchException("Invalid response from fundfy API for fund: " + fundCode);
            }

            return new InvestmentExternalDto(response.title(), response.price());
        } catch (MarketDataFetchException e) {
            throw e;

        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Fund not found for code {}: {}", fundCode, e.getMessage());
            throw new AssetNotFoundException("Fund not found for code: " + fundCode + ". Please check the code and try again.");
        } catch (Exception e) {
            log.error("Error fetching fund price for {}: {}", fundCode, e.getMessage());
            throw new MarketDataFetchException("Failed to fetch fund price for: " + fundCode, e);
        }
    }

    @Cacheable(value = "stockPrices", key = "#symbol.toUpperCase()")
    public InvestmentExternalDto getStockInfo(String symbol) {
        try {
            String url = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}";
            String response = restClient.get()
                    .uri(url, symbol.toUpperCase())
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.5")
                    .header("Accept-Encoding", "gzip, deflate, br")
                    .header("Upgrade-Insecure-Requests", "1")
                    .header("Cache-Control", "max-age=0")
                    .header("DNT", "1")
                    .header("Sec-Ch-Ua", "\"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Google Chrome\";v=\"144\"")
                    .header("Sec-Ch-Ua-Mobile", "?0")
                    .header("Sec-Ch-Ua-Platform", "\"Windows\"")
                    .header("Sec-Fetch-Dest", "document")
                    .header("Sec-Fetch-Mode", "navigate")
                    .header("Sec-Fetch-Site", "same-origin")
                    .header("Sec-Fetch-User", "?1")
                    .header("Upgrade-Insecure-Requests", "1")
                    .retrieve()
                    .body(String.class);
            JsonNode root = new ObjectMapper().readTree(response);
            JsonNode meta = root.path("chart").path("result").get(0).path("meta");

            if (meta.isMissingNode()) {
                throw new AssetNotFoundException("Symbol not found: " + symbol);
            }

            BigDecimal price = meta.path("regularMarketPrice").decimalValue();
            String name = meta.path("longName").asText();

            return new InvestmentExternalDto(name, price);
        } catch (Exception e) {
            log.error("Error fetching stock price for {}: {}", symbol, e.getMessage());
            throw new MarketDataFetchException("Failed to fetch stock price for: " + symbol, e);
        }

    }


    @Scheduled(cron = "0 5 0 * * *", zone = "Europe/Istanbul")
    @CacheEvict(cacheNames = "exchangeRates", key = "'USD_TRY'")
    public void evictExchangeNightly() {
        log.info("Evicted exchangeRates:USD_TRY at {}", LocalDateTime.now());
    }

    @Scheduled(cron = "0 5 10 * * *", zone = "Europe/Istanbul")
    @CacheEvict(value = "fundPrices", allEntries = true)
    public void evictFundsDaily() {
        log.info("Evicted all fundPrices at {}", LocalDateTime.now());
    }

    @Scheduled(cron = "0 */5 * * * *", zone = "Europe/Istanbul")
    @CacheEvict(value = "metalPrices", allEntries = true)
    public void evictMetalsEvery5Minutes() {
        log.info("Evicted all metalPrices at {}", LocalDateTime.now());
    }

    @Scheduled(cron = "0 */5 * * * *", zone = "Europe/Istanbul")
    @CacheEvict(value = "stockPrices", allEntries = true)
    public void evictStocksEvery5Minutes() {
        log.info("Evicted all stockPrices at {}", LocalDateTime.now());
    }
}