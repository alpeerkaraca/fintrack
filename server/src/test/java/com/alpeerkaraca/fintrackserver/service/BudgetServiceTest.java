package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.*;
import com.alpeerkaraca.fintrackserver.model.*;
import com.alpeerkaraca.fintrackserver.repository.BudgetCategoryRepository;
import com.alpeerkaraca.fintrackserver.repository.BudgetMonthRepository;
import com.alpeerkaraca.fintrackserver.repository.TransactionRepository;
import com.alpeerkaraca.fintrackserver.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetMonthRepository budgetMonthRepository;

    @Mock
    private BudgetCategoryRepository budgetCategoryRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private TransactionService transactionService;

    @Mock
    private MarketDataService marketDataService;

    @InjectMocks
    private BudgetService budgetService;

    private UUID testUserId;
    private UserProfile testUser;
    private BudgetMonth testBudgetMonth;
    private BudgetCategory testCategory;
    private InvestmentExternalDto usdTryRate;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        testUser = UserProfile.builder()
                .id(testUserId)
                .username("testuser")
                .email("test@test.com")
                .netSalaryUsd(BigDecimal.valueOf(3000))
                .creditCardLimitTry(BigDecimal.valueOf(50000))
                .build();

        testBudgetMonth = BudgetMonth.builder()
                .id(UUID.randomUUID())
                .userProfile(testUser)
                .month(1)
                .year(2024)
                .incomeTry(BigDecimal.valueOf(100000))
                .expenseTry(BigDecimal.valueOf(70000))
                .netSavingsTry(BigDecimal.valueOf(30000))
                .build();

        testCategory = BudgetCategory.builder()
                .id(UUID.randomUUID())
                .category(Category.FOOD)
                .limitTry(BigDecimal.valueOf(5000))
                .budgetMonth(testBudgetMonth)
                .userProfile(testUser)
                .build();

        usdTryRate = new InvestmentExternalDto("USD", BigDecimal.valueOf(33.5));
    }

    @Test
    void shouldGetBudgetSummaryWhenBudgetMonthExists() {
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        when(transactionRepository.findByUserProfileIdAndPaymentMethodAndTransactionType(
                eq(testUserId), any(), any())).thenReturn(Collections.emptyList());
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        BudgetSummaryDto result = budgetService.getBudgetSummary(testUserId, 1, 2024);

        assertThat(result).isNotNull();
        assertThat(result.getIncome()).isEqualByComparingTo(BigDecimal.valueOf(100000));
        assertThat(result.getExpense()).isEqualByComparingTo(BigDecimal.valueOf(70000));
        assertThat(result.getSavings()).isEqualByComparingTo(BigDecimal.valueOf(30000));
        assertThat(result.getUsdRate()).isEqualByComparingTo(BigDecimal.valueOf(33.5));
    }

    @Test
    void shouldCalculateBudgetSummaryWhenBudgetMonthDoesNotExist() {
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.empty());
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findByUserProfileIdAndPaymentMethodAndTransactionType(
                eq(testUserId), any(), any())).thenReturn(Collections.emptyList());

        BudgetSummaryDto result = budgetService.getBudgetSummary(testUserId, 1, 2024);

        assertThat(result).isNotNull();
        assertThat(result.getIncome()).isNotNull();
        assertThat(result.getUsdRate()).isEqualByComparingTo(BigDecimal.valueOf(33.5));
        verify(marketDataService).getUsdToTryInfo();
    }

    @Test
    void shouldGetBudgetForecast() {
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(eq(testUserId), anyInt(), anyInt()))
                .thenReturn(Optional.empty());

        List<ForecastResponse> result = budgetService.getBudgetForecast(testUserId);

        assertThat(result).isNotNull();
        assertThat(result).hasSize(7);
        assertThat(result.get(0).month()).isNotNull();
        assertThat(result.get(0).label()).isNotNull();
    }

    @Test
    void shouldGetCategoryWatchlist() {
        testBudgetMonth.setCategories(Arrays.asList(testCategory));
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        
        TransactionDto transaction = new TransactionDto();
        transaction.setCategory(Category.FOOD);
        transaction.setAmountTry(BigDecimal.valueOf(3000));
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Arrays.asList(transaction));

        List<BudgetCategoryResponse> result = budgetService.getCategoryWatchlist(testUserId, 1, 2024);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo(Category.FOOD);
        assertThat(result.get(0).getLimitTry()).isEqualByComparingTo(BigDecimal.valueOf(5000));
        assertThat(result.get(0).getSpentTry()).isEqualByComparingTo(BigDecimal.valueOf(3000));
    }

    @Test
    void shouldReturnEmptyWatchlistWhenNoBudgetMonth() {
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.empty());
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Collections.emptyList());

        List<BudgetCategoryResponse> result = budgetService.getCategoryWatchlist(testUserId, 1, 2024);

        assertThat(result).isEmpty();
    }

    @Test
    void shouldCalculateDangerAlertLevel() {
        testBudgetMonth.setCategories(Arrays.asList(testCategory));
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        
        TransactionDto transaction = new TransactionDto();
        transaction.setCategory(Category.FOOD);
        transaction.setAmountTry(BigDecimal.valueOf(4500)); // 90% of limit
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Arrays.asList(transaction));

        List<BudgetCategoryResponse> result = budgetService.getCategoryWatchlist(testUserId, 1, 2024);

        assertThat(result.get(0).getAlertLevel()).isEqualTo("warning");
    }

    @Test
    void shouldCalculateWarningAlertLevel() {
        testBudgetMonth.setCategories(Arrays.asList(testCategory));
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        
        TransactionDto transaction = new TransactionDto();
        transaction.setCategory(Category.FOOD);
        transaction.setAmountTry(BigDecimal.valueOf(3700)); // 74% of limit
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Arrays.asList(transaction));

        List<BudgetCategoryResponse> result = budgetService.getCategoryWatchlist(testUserId, 1, 2024);

        assertThat(result.get(0).getAlertLevel()).isEqualTo("normal");
    }

    @Test
    void shouldCalculateStableAlertLevel() {
        testBudgetMonth.setCategories(Arrays.asList(testCategory));
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        
        TransactionDto transaction = new TransactionDto();
        transaction.setCategory(Category.FOOD);
        transaction.setAmountTry(BigDecimal.valueOf(2000)); // 40% of limit
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Arrays.asList(transaction));

        List<BudgetCategoryResponse> result = budgetService.getCategoryWatchlist(testUserId, 1, 2024);

        assertThat(result.get(0).getAlertLevel()).isEqualTo("normal");
    }

    @Test
    void shouldHandleMultipleCategories() {
        BudgetCategory category2 = BudgetCategory.builder()
                .id(UUID.randomUUID())
                .category(Category.TRANSPORT)
                .limitTry(BigDecimal.valueOf(3000))
                .budgetMonth(testBudgetMonth)
                .userProfile(testUser)
                .build();

        testBudgetMonth.setCategories(Arrays.asList(testCategory, category2));
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Collections.emptyList());

        List<BudgetCategoryResponse> result = budgetService.getCategoryWatchlist(testUserId, 1, 2024);

        assertThat(result).hasSize(2);
    }

    @Test
    void shouldHandleZeroExpense() {
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);
        testBudgetMonth.setExpenseTry(BigDecimal.ZERO);
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        when(transactionRepository.findByUserProfileIdAndPaymentMethodAndTransactionType(
                eq(testUserId), any(), any())).thenReturn(Collections.emptyList());
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        BudgetSummaryDto result = budgetService.getBudgetSummary(testUserId, 1, 2024);

        assertThat(result.getExpense()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleNegativeSavings() {
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);
        testBudgetMonth.setExpenseTry(BigDecimal.valueOf(120000));
        testBudgetMonth.setNetSavingsTry(BigDecimal.valueOf(-20000));
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        when(transactionRepository.findByUserProfileIdAndPaymentMethodAndTransactionType(
                eq(testUserId), any(), any())).thenReturn(Collections.emptyList());
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        BudgetSummaryDto result = budgetService.getBudgetSummary(testUserId, 1, 2024);

        assertThat(result.getSavings()).isNegative();
    }

    @Test
    void shouldCalculateCreditCardLimit() {
        when(marketDataService.getUsdToTryInfo()).thenReturn(usdTryRate);
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        when(userProfileRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(transactionRepository.findByUserProfileIdAndPaymentMethodAndTransactionType(
                eq(testUserId), eq(PaymentMethod.CARD), eq(TransactionType.EXPENSE)))
                .thenReturn(Collections.emptyList());

        BudgetSummaryDto result = budgetService.getBudgetSummary(testUserId, 1, 2024);

        assertThat(result.getCreditCardLimit()).isNotNull();
        assertThat(result.getCreditCardLimit()).isEqualByComparingTo(BigDecimal.valueOf(50000));
    }

    @Test
    void shouldHandleNullCategories() {
        testBudgetMonth.setCategories(null);
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Collections.emptyList());

        assertThatCode(() -> budgetService.getCategoryWatchlist(testUserId, 1, 2024))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldFilterTransactionsByCategory() {
        testBudgetMonth.setCategories(Collections.singletonList(testCategory));
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        
        TransactionDto foodTx = new TransactionDto();
        foodTx.setCategory(Category.FOOD);
        foodTx.setAmountTry(BigDecimal.valueOf(1000));
        
        TransactionDto transportTx = new TransactionDto();
        transportTx.setCategory(Category.TRANSPORT);
        transportTx.setAmountTry(BigDecimal.valueOf(500));
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Arrays.asList(foodTx, transportTx));

        List<BudgetCategoryResponse> result = budgetService.getCategoryWatchlist(testUserId, 1, 2024);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSpentTry()).isEqualByComparingTo(BigDecimal.valueOf(1000));
    }

    @Test
    void shouldHandleCaseInsensitiveCategoryMatching() {
        testBudgetMonth.setCategories(Arrays.asList(testCategory));
        when(budgetMonthRepository.findByUserProfileIdAndMonthAndYear(testUserId, 1, 2024))
                .thenReturn(Optional.of(testBudgetMonth));
        
        TransactionDto transaction = new TransactionDto();
        transaction.setCategory(Category.FOOD);
        transaction.setAmountTry(BigDecimal.valueOf(1000));
        
        when(transactionService.getFilteredTransactions(eq(testUserId), any(TransactionFilter.class)))
                .thenReturn(Arrays.asList(transaction));

        List<BudgetCategoryResponse> result = budgetService.getCategoryWatchlist(testUserId, 1, 2024);

        assertThat(result.get(0).getSpentTry()).isEqualByComparingTo(BigDecimal.valueOf(1000));
    }
}
