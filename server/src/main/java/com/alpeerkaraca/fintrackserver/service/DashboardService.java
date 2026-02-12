package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DashboardService {

    private final BudgetService budgetService;
    private final InvestmentService investmentService;
    private final MarketDataService marketDataService;
    private final TransactionService transactionService;

    @Cacheable(value = "overviews",
            key = "T(String).format('%s:%04d-%02d', #userId, #year, #month)")
    public DashboardOverviewCore getOverviewCore(UUID userId, Integer month, Integer year) {

        BudgetSummaryDto summary = budgetService.getBudgetSummary(userId, month, year);
        List<ForecastResponse> forecast = budgetService.getBudgetForecast(userId);
        List<BudgetCategoryResponse> categoryWatchList = budgetService.getCategoryWatchlist(userId, month, year);
        List<InvestmentAssetDto> investments = investmentService.getUserPortfolio(userId);
        BigDecimal currentUsdTryRate = marketDataService.getUsdToTryInfo().price();

        return DashboardOverviewCore.builder()
                .summary(summary)
                .forecast(forecast)
                .categoryWatchlist(categoryWatchList)
                .investments(investments)
                .currentUsdTryRate(currentUsdTryRate)
                .build();
    }

    public DashboardOverviewResponse getOverview(UUID userId, Integer month, Integer year, Pageable pageable, DashboardOverviewCore core) {
        TransactionFilter filter = TransactionFilter.builder()
                .month(month)
                .year(year)
                .expanded(true)
                .build();

        Page<TransactionDto> recentTransactions = transactionService.getFilteredTransactions(userId, filter, pageable, true);

        return DashboardOverviewResponse.builder()
                .summary(core.getSummary())
                .forecast(core.getForecast())
                .categoryWatchlist(core.getCategoryWatchlist())
                .investments(core.getInvestments())
                .currentUsdTryRate(core.getCurrentUsdTryRate())
                .recentTransactions(PageDtos.of(recentTransactions))
                .build();
    }
}
