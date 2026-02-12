package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import com.alpeerkaraca.fintrackserver.dto.ExchangeRateDto;
import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.MarketAssetType;
import com.alpeerkaraca.fintrackserver.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/market-data")
public class MarketDataController {
    private final MarketDataService marketDataService;

    @GetMapping("/supported-assets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupportedAssets() {
        Map<String, Object> response = new HashMap<>();
        response.put(AssetType.GOLD_SILVER.name(), List.of(MarketAssetType.values()));

        response.put(AssetType.CURRENCY.name(), List.of(
                Map.of("slug", "USD", "label", "Amerikan Doları")
        ));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/usd-try")
    public ResponseEntity<ApiResponse<ExchangeRateDto>> getUsdTryRate() {
        ExchangeRateDto exchangeRateDto = new ExchangeRateDto(marketDataService.getUsdToTryInfo().price());
        return ResponseEntity.ok(ApiResponse.success(exchangeRateDto));
    }
}
