package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import com.alpeerkaraca.fintrackserver.dto.frontend.CategoryResponse;
import com.alpeerkaraca.fintrackserver.dto.frontend.StockMarketResponse;
import com.alpeerkaraca.fintrackserver.service.MetadataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/metadata")
public class MetadataController {
    private final MetadataService metadataService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        return ResponseEntity.ok(
                ApiResponse.success("Categories retrieved successfully",
                        metadataService.getAvailableCategories()
                )
        );
    }

    @GetMapping("/stock-markets")
    public ResponseEntity<ApiResponse<List<StockMarketResponse>>> getStockMarkets() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Stock markets retrieved successfully",
                        metadataService.getAvailableMarkets()
                )
        );

    }
}
