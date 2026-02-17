package com.alpeerkaraca.fintrackserver.model;

import lombok.Getter;

import java.util.List;

@Getter
public enum StockMarket {
    BIST("Borsa Istanbul", "IS", "TRY", List.of(AssetType.STOCK)),
    TEFAS("TEFAS", "TEFAS", "TRY", List.of(AssetType.FUND)),
    NASDAQ("NASDAQ", "US", "USD", List.of(AssetType.STOCK, AssetType.FUND)),
    NYSE("New York Stock Exchange", "US", "USD", List.of(AssetType.STOCK, AssetType.FUND)),
    OTHER("Other", "OTHER", "TRY", List.of(AssetType.CURRENCY, AssetType.GOLD_SILVER));
    private final String label;
    private final String suffix;
    private final String currency;
    private final List<AssetType> supportedAssetTypes;

    StockMarket(String label, String suffix, String currency, List<AssetType> supportedAssetTypes) {
        this.label = label;
        this.suffix = suffix;
        this.currency = currency;
        this.supportedAssetTypes = supportedAssetTypes;
    }
}
