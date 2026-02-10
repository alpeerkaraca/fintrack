package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.*;
import com.alpeerkaraca.fintrackserver.security.UserPrincipal;
import com.alpeerkaraca.fintrackserver.service.BudgetService;
import com.alpeerkaraca.fintrackserver.service.InvestmentService;
import com.alpeerkaraca.fintrackserver.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final BudgetService budgetService;
    private final InvestmentService investmentService;
    private final MarketDataService marketDataService;

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewResponse> getDashboardOverview(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam Integer month,
            @RequestParam Integer year) {

        UUID userId = userPrincipal.id();

        BudgetSummaryDto summary = budgetService.getBudgetSummary(userId, month, year);

        List<ForecastResponse> forecast = budgetService.getBudgetForecast(userId);

        List<BudgetCategoryResponse> categoryWatchlist = budgetService.getCategoryWatchlist(userId, month, year);

        List<InvestmentAssetDto> investments = investmentService.getUserPortfolio(userId);

        BigDecimal currentUsdTryRate = marketDataService.getUsdToTryExchangeRate();

        return ResponseEntity.ok(DashboardOverviewResponse.builder()
                .summary(summary)
                .forecast(forecast)
                .categoryWatchlist(categoryWatchlist)
                .investments(investments)
                .currentUsdTryRate(currentUsdTryRate)
                .build());
    }

}
