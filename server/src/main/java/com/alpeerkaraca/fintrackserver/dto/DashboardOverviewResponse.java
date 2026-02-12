package com.alpeerkaraca.fintrackserver.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PagedModel;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardOverviewResponse {
    private BudgetSummaryDto summary;
    private List<ForecastResponse> forecast;
    private List<BudgetCategoryResponse> categoryWatchlist;
    private List<InvestmentAssetDto> investments;
    private BigDecimal currentUsdTryRate;
    private PageDto<TransactionDto> recentTransactions;
}
