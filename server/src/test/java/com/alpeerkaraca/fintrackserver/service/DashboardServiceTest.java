package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private BudgetService budgetService;

    @Mock
    private InvestmentService investmentService;

    @Mock
    private MarketDataService marketDataService;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private DashboardService dashboardService;

    private UUID testUserId;
    private BudgetSummaryDto budgetSummary;
    private List<ForecastResponse> forecast;
    private List<BudgetCategoryResponse> categoryWatchlist;
    private List<InvestmentAssetDto> investments;
    private InvestmentExternalDto usdTryRate;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        budgetSummary = BudgetSummaryDto.builder()
                .income(BigDecimal.valueOf(100000))
                .expense(BigDecimal.valueOf(70000))
                .savings(BigDecimal.valueOf(30000))
                .creditCardLimit(BigDecimal.valueOf(40000))
                .usdRate(BigDecimal.valueOf(33.5))
                .build();

        forecast = Arrays.asList(
                new ForecastResponse("2024-01", "JAN", BigDecimal.valueOf(30000)),
                new ForecastResponse("2024-02", "FEB", BigDecimal.valueOf(25000))
        );

        BudgetCategoryResponse category = BudgetCategoryResponse.builder()
                .category("Food")
                .limitTry(BigDecimal.valueOf(5000))
                .spentTry(BigDecimal.valueOf(3000))
                .alertLevel("STABLE")
                .build();
        categoryWatchlist = Arrays.asList(category);

        InvestmentAssetDto investment = new InvestmentAssetDto();
        investment.setSymbol("AAPL");
        investment.setCurrentPriceTry(BigDecimal.valueOf(2000));
        investments = Arrays.asList(investment);

        usdTryRate = new InvestmentExternalDto("USD", BigDecimal.valueOf(33.5));
    }

    @Test
    void shouldGetOverviewCore() {
        when(budgetService.getBudgetSummary(testUserId, 1, 2024)).thenReturn(budgetSummary);
        when(budgetService.getBudgetForecast(testUserId)).thenReturn(forecast);
        when(budgetService.getCategoryWatchlist(testUserId, 1, 2024)).thenReturn(categoryWatchlist);
        when(investmentService.getUserPortfolio(testUserId)).thenReturn(investments);
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);

        DashboardOverviewCore result = dashboardService.getOverviewCore(testUserId, 1, 2024);

        assertThat(result).isNotNull();
        assertThat(result.getSummary()).isEqualTo(budgetSummary);
        assertThat(result.getForecast()).hasSize(2);
        assertThat(result.getCategoryWatchlist()).hasSize(1);
        assertThat(result.getInvestments()).hasSize(1);
        assertThat(result.getCurrentUsdTryRate()).isEqualByComparingTo(BigDecimal.valueOf(33.5));

        verify(budgetService).getBudgetSummary(testUserId, 1, 2024);
        verify(budgetService).getBudgetForecast(testUserId);
        verify(budgetService).getCategoryWatchlist(testUserId, 1, 2024);
        verify(investmentService).getUserPortfolio(testUserId);
        verify(marketDataService).getUsdToTryInfo();
    }

    @Test
    void shouldGetFullOverviewWithTransactions() {
        DashboardOverviewCore core = DashboardOverviewCore.builder()
                .summary(budgetSummary)
                .forecast(forecast)
                .categoryWatchlist(categoryWatchlist)
                .investments(investments)
                .currentUsdTryRate(BigDecimal.valueOf(33.5))
                .build();

        TransactionDto transaction = new TransactionDto();
        transaction.setTitle("Test Transaction");
        Page<TransactionDto> transactionPage = new PageImpl<>(Arrays.asList(transaction));

        Pageable pageable = PageRequest.of(0, 10);
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class), eq(pageable), eq(true)))
                .thenReturn(transactionPage);

        DashboardOverviewResponse result = dashboardService.getOverview(testUserId, 1, 2024, pageable, core);

        assertThat(result).isNotNull();
        assertThat(result.getSummary()).isEqualTo(budgetSummary);
        assertThat(result.getForecast()).hasSize(2);
        assertThat(result.getCategoryWatchlist()).hasSize(1);
        assertThat(result.getInvestments()).hasSize(1);
        assertThat(result.getRecentTransactions()).isNotNull();
        assertThat(result.getRecentTransactions().content()).hasSize(1);

        verify(transactionService).getFilteredTransactions(eq(testUserId), any(TransactionFilter.class), eq(pageable), eq(true));
    }

    @Test
    void shouldHandleEmptyInvestments() {
        when(budgetService.getBudgetSummary(testUserId, 1, 2024)).thenReturn(budgetSummary);
        when(budgetService.getBudgetForecast(testUserId)).thenReturn(forecast);
        when(budgetService.getCategoryWatchlist(testUserId, 1, 2024)).thenReturn(categoryWatchlist);
        when(investmentService.getUserPortfolio(testUserId)).thenReturn(Collections.emptyList());
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);

        DashboardOverviewCore result = dashboardService.getOverviewCore(testUserId, 1, 2024);

        assertThat(result.getInvestments()).isEmpty();
    }

    @Test
    void shouldHandleEmptyCategories() {
        when(budgetService.getBudgetSummary(testUserId, 1, 2024)).thenReturn(budgetSummary);
        when(budgetService.getBudgetForecast(testUserId)).thenReturn(forecast);
        when(budgetService.getCategoryWatchlist(testUserId, 1, 2024)).thenReturn(Collections.emptyList());
        when(investmentService.getUserPortfolio(testUserId)).thenReturn(investments);
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);

        DashboardOverviewCore result = dashboardService.getOverviewCore(testUserId, 1, 2024);

        assertThat(result.getCategoryWatchlist()).isEmpty();
    }

    @Test
    void shouldHandleEmptyTransactions() {
        DashboardOverviewCore core = DashboardOverviewCore.builder()
                .summary(budgetSummary)
                .forecast(forecast)
                .categoryWatchlist(categoryWatchlist)
                .investments(investments)
                .currentUsdTryRate(BigDecimal.valueOf(33.5))
                .build();

        Page<TransactionDto> emptyPage = new PageImpl<>(Collections.emptyList());
        Pageable pageable = PageRequest.of(0, 10);
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class), eq(pageable), eq(true)))
                .thenReturn(emptyPage);

        DashboardOverviewResponse result = dashboardService.getOverview(testUserId, 1, 2024, pageable, core);

        assertThat(result.getRecentTransactions().content()).isEmpty();
    }

    @Test
    void shouldPassCorrectFilterToTransactionService() {
        DashboardOverviewCore core = DashboardOverviewCore.builder()
                .summary(budgetSummary)
                .forecast(forecast)
                .categoryWatchlist(categoryWatchlist)
                .investments(investments)
                .currentUsdTryRate(BigDecimal.valueOf(33.5))
                .build();

        Page<TransactionDto> emptyPage = new PageImpl<>(Collections.emptyList());
        Pageable pageable = PageRequest.of(0, 10);
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class), eq(pageable), eq(true)))
                .thenReturn(emptyPage);

        dashboardService.getOverview(testUserId, 3, 2024, pageable, core);

        verify(transactionService).getFilteredTransactions(
                eq(testUserId),
                argThat(filter -> filter.getMonth().equals(3) && filter.getYear().equals(2024) && filter.isExpanded()),
                eq(pageable),
                eq(true)
        );
    }

    @Test
    void shouldCacheOverviewCore() {
        when(budgetService.getBudgetSummary(testUserId, 1, 2024)).thenReturn(budgetSummary);
        when(budgetService.getBudgetForecast(testUserId)).thenReturn(forecast);
        when(budgetService.getCategoryWatchlist(testUserId, 1, 2024)).thenReturn(categoryWatchlist);
        when(investmentService.getUserPortfolio(testUserId)).thenReturn(investments);
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);

        DashboardOverviewCore result1 = dashboardService.getOverviewCore(testUserId, 1, 2024);
        DashboardOverviewCore result2 = dashboardService.getOverviewCore(testUserId, 1, 2024);

        assertThat(result1).isNotNull();
        assertThat(result2).isNotNull();
    }

    @Test
    void shouldHandleDifferentMonthsAndYears() {
        when(budgetService.getBudgetSummary(testUserId, 12, 2023)).thenReturn(budgetSummary);
        when(budgetService.getBudgetForecast(testUserId)).thenReturn(forecast);
        when(budgetService.getCategoryWatchlist(testUserId, 12, 2023)).thenReturn(categoryWatchlist);
        when(investmentService.getUserPortfolio(testUserId)).thenReturn(investments);
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);

        DashboardOverviewCore result = dashboardService.getOverviewCore(testUserId, 12, 2023);

        assertThat(result).isNotNull();
        verify(budgetService).getBudgetSummary(testUserId, 12, 2023);
        verify(budgetService).getCategoryWatchlist(testUserId, 12, 2023);
    }

    @Test
    void shouldHandlePagination() {
        DashboardOverviewCore core = DashboardOverviewCore.builder()
                .summary(budgetSummary)
                .forecast(forecast)
                .categoryWatchlist(categoryWatchlist)
                .investments(investments)
                .currentUsdTryRate(BigDecimal.valueOf(33.5))
                .build();

        Pageable pageable = PageRequest.of(2, 20);
        Page<TransactionDto> transactionPage = new PageImpl<>(Collections.emptyList(), pageable, 100);
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class), eq(pageable), eq(true)))
                .thenReturn(transactionPage);

        DashboardOverviewResponse result = dashboardService.getOverview(testUserId, 1, 2024, pageable, core);

        assertThat(result.getRecentTransactions().totalElements()).isEqualTo(100);
        assertThat(result.getRecentTransactions().totalPages()).isEqualTo(5);
        verify(transactionService).getFilteredTransactions(eq(testUserId), any(), eq(pageable), eq(true));
    }
}
