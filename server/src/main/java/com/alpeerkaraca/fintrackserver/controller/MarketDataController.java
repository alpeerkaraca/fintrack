package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.MarketAssetType;
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
    @GetMapping("/supported-assets")
    public ResponseEntity<Map<String, Object>> getSupportedAssets() {
        Map<String, Object> response = new HashMap<>();
        response.put(AssetType.GOLD_SILVER.name(), List.of(MarketAssetType.values()));

        response.put(AssetType.CURRENCY.name(), List.of(
                Map.of("slug", "USD", "label", "Amerikan Doları"),
                Map.of("slug", "EUR", "label", "Euro"),
                Map.of("slug", "GBP", "label", "İngiliz Sterlini")
        ));
        response.put(AssetType.FUND.name(), Collections.emptyList());
        response.put(AssetType.STOCK.name(), Collections.emptyList());
        return ResponseEntity.ok(response);
    }
}
