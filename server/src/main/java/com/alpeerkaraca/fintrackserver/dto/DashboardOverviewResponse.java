package com.alpeerkaraca.fintrackserver.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardOverviewResponse {
    private BudgetSummaryDto summary;
    private List<ForecastResponse> forecast;
    private List<BudgetCategoryResponse> categoryWatchlist;
    private List<InvestmentAssetDto> investments;
    private BigDecimal currentUsdTryRate;
}
