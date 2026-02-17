package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.frontend.CategoryResponse;
import com.alpeerkaraca.fintrackserver.dto.frontend.StockMarketResponse;
import com.alpeerkaraca.fintrackserver.model.Category;
import com.alpeerkaraca.fintrackserver.model.StockMarket;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MetadataService {
    public List<CategoryResponse> getAvailableCategories() {
        return Arrays.stream(Category.values())
                .map(cat -> new CategoryResponse(
                        cat.name(),
                        cat.getLabel(),
                        cat.getIcon()
                )).toList();
    }

    public List<StockMarketResponse> getAvailableMarkets() {
        return Arrays.stream(StockMarket.values())
                .map(market -> new StockMarketResponse(
                        market.name(),
                        market.name(),
                        market.getLabel(),
                        market.getCurrency(),
                        market.getSupportedAssetTypes()
                )).toList();
    }
}
