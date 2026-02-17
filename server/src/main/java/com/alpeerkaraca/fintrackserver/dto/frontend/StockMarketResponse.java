package com.alpeerkaraca.fintrackserver.dto.frontend;

import com.alpeerkaraca.fintrackserver.model.AssetType;

import java.util.List;

public record StockMarketResponse(
        String id,
        String label,
        String suffix,
        String currency,
        List<AssetType> supportedAssetTypes
) {
}
