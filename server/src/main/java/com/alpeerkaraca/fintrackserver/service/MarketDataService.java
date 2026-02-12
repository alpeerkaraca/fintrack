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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketDataService {
    private static final String URL = "https://v6.exchangerate-api.com/v6/API_URL/pair/USD/TRY";
    private final RestTemplate restTemplate;
    @Value("${app.exchange.api-key}")
    private String exchangeApiKey;

    @Cacheable(value = "exchangeRates", key = "'USD_TRY'")
    public InvestmentExternalDto getUsdToTryInfo() {
        try {
            String url = URL.replace("API_URL", exchangeApiKey);
            ExchangeRateResponse response = restTemplate.getForObject(url, ExchangeRateResponse.class);
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
            String url = "https://bloomberght.com/" + metalName;
            Document doc = Jsoup.connect(url).get();
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
            String url = "https://api.fundfy.net/api/v1/fund/detail/" + fundCode;
            FundResponse response = restTemplate.getForObject(url, FundResponse.class);

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
}