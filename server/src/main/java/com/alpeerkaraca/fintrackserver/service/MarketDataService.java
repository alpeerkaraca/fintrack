package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.ExchangeRateResponse;
import com.alpeerkaraca.fintrackserver.dto.FundResponse;
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

    @Cacheable(value = "marketData", key = "'usdTryRate'")
    public BigDecimal getUsdToTryExchangeRate() {
        try {
            String url = URL.replace("API_URL", exchangeApiKey);
            ExchangeRateResponse response = restTemplate.getForObject(url, ExchangeRateResponse.class);
            if (response != null
                    && "success".equalsIgnoreCase(response.result())
                    && response.conversion_rate() != null) {
                return response.conversion_rate();
            }
        } catch (Exception e) {
            log.error("Error fetching exchange rate: {}", e.getMessage());
        }
        return new BigDecimal("123.45"); // Default fallback value
    }

    @Cacheable(value = "marketData", key = "#metalName")
    public BigDecimal getMetalPrice(String metalName) {
        try {
            String url = "https://bloomberght.com/" + metalName;
            Document doc = Jsoup.connect(url).get();
            String priceText = doc
                    .select("[class^=security-] span")
                    .first()
                    .text()
                    .replace(".", "");
            return new BigDecimal(priceText.replace(",", "."));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    @Cacheable(value = "marketData", key = "#fundCode")
    public BigDecimal getFundPrice(String fundCode) {
        try {
            String url = "https://api.fundfy.net/api/v1/fund/detail/" + fundCode;
            FundResponse response = restTemplate.getForObject(url, FundResponse.class);

            if (response == null || response.price() == null) {
                throw new RuntimeException("Invalid response from fundfy API");
            }

            return response.price();



        } catch (Exception e) {
            log.error("Error fetching fund price: {}", e.getMessage());
        }
        return BigDecimal.ZERO;
    }


}
