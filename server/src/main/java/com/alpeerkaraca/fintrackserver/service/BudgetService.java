package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.*;
import com.alpeerkaraca.fintrackserver.model.BudgetCategory;
import com.alpeerkaraca.fintrackserver.model.PaymentMethod;
import com.alpeerkaraca.fintrackserver.model.Transaction;
import com.alpeerkaraca.fintrackserver.model.TransactionType;
import com.alpeerkaraca.fintrackserver.repository.BudgetCategoryRepository;
import com.alpeerkaraca.fintrackserver.repository.BudgetMonthRepository;
import com.alpeerkaraca.fintrackserver.repository.TransactionRepository;
import com.alpeerkaraca.fintrackserver.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {
    private static final double ALERT_DANGER_THRESHOLD = 0.85;
    private static final double ALERT_WARNING_THRESHOLD = 0.70;
    private static final String ALERT_DANGER = "DANGER";
    private static final String ALERT_WARNING = "WARNING";
    private static final String ALERT_STABLE = "STABLE";
    private static final String LIMIT_DANGER_THRESHOLD = "1.00";
    private static final String LIMIT_WARNING_THRESHOLD = "0.85";
    private static final String LIMIT_DANGER = "danger";
    private static final String LIMIT_WARNING = "warning";
    private static final String LIMIT_NORMAL = "normal";
    private final BudgetMonthRepository budgetMonthRepository;
    private final BudgetCategoryRepository budgetCategoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserProfileRepository userProfileRepository;
    private final TransactionService transactionService;

    public BudgetSummaryDto getBudgetSummary(UUID userId, Integer month, Integer year) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        BigDecimal income = calculateIncomesMonthly(userId, month, year);
        BigDecimal expense = transactionRepository.sumAmountByUserIdAndMonthAndYearAndType(
                        userId, month, year, com.alpeerkaraca.fintrackserver.model.TransactionType.EXPENSE)
                .orElse(BigDecimal.ZERO);
        BigDecimal savings = income.subtract(expense);

        BigDecimal cardExpense = calculateCreditCardUsed(userId, month, year);
        BigDecimal userLimit = userProfileRepository.findById(userId).get().getCreditCardLimitTry();

        BigDecimal creditCardRemainingLimit = userLimit.subtract(cardExpense);

        return BudgetSummaryDto.builder()
                .income(income)
                .expense(expense)
                .savings(savings)
                .creditCardLimit(creditCardRemainingLimit)
                .build();
    }

    private BigDecimal calculateCreditCardUsed(UUID userId, Integer month, Integer year) {
        YearMonth targetMonth = YearMonth.of(year, month);

        List<Transaction> cardTransactions = transactionRepository.findByUserProfileIdAndPaymentMethodAndTransactionType(
                userId, PaymentMethod.CARD, TransactionType.EXPENSE);
        return cardTransactions.stream()
                .map(t -> {
                    if (!Boolean.TRUE.equals(t.getIsInstallment())) {
                        if (YearMonth.from(t.getDate()).equals(targetMonth)) {
                            return t.getAmountTry();
                        }
                        return BigDecimal.ZERO;
                    }

                    if (t.getInstallmentMeta() != null) {
                        YearMonth start = YearMonth.parse(t.getInstallmentMeta().getStartMonth());
                        YearMonth end = start.plusMonths(t.getInstallmentMeta().getMonths() - 1);
                        if (!targetMonth.isBefore(start) && !targetMonth.isAfter(end)) {
                            return t.getInstallmentMeta().getTotalTry()
                                    .divide(BigDecimal.valueOf(t.getInstallmentMeta().getMonths()), 2, RoundingMode.HALF_UP);
                        }
                    }
                    return BigDecimal.ZERO;
                }).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<ForecastResponse> getBudgetForecast(UUID userId) {
        List<ForecastResponse> forecastList = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();

        for (int i = -3; i <= 3; i++) {
            YearMonth targetMonth = currentMonth.plusMonths(i);

            BigDecimal income = calculateIncomesMonthly(userId, targetMonth.getMonthValue(), targetMonth.getYear());
            BigDecimal expense = calculateExpensesMonthly(userId, targetMonth.getMonthValue(), targetMonth.getYear());
            BigDecimal savings = income.subtract(expense);
            forecastList.add(new ForecastResponse(
                    targetMonth.toString(), targetMonth.getMonth().name().substring(0, 3),
                    savings
            ));
        }
        return forecastList;
    }

    public String getBudgetAlerts(UUID userId) {
        BigDecimal income = calculateIncomesMonthly(userId, LocalDate.now().getMonthValue(), LocalDate.now().getYear());
        BigDecimal expense = calculateExpensesMonthly(userId, LocalDate.now().getMonthValue(), LocalDate.now().getYear());
        return getAlertStatus(income, expense);
    }

    public List<BudgetCategoryResponse> getCategoryWatchlist(UUID userId, Integer month, Integer year) {
        List<BudgetCategory> categoryLimitList = budgetCategoryRepository.findByUserId(userId);
        TransactionFilter filter = new TransactionFilter(month, year, null, null, true);
        List<TransactionDto> monthlyTransactions = transactionService.getFilteredTransactions(userId, filter);

        return categoryLimitList.stream().map(limit -> {
            BigDecimal totalSpent = monthlyTransactions.stream()
                    .filter(t -> t.getCategory() != null && t.getCategory().equalsIgnoreCase(limit.getCategory()))
                    .map(TransactionDto::getAmountTry)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            return BudgetCategoryResponse.builder()
                    .category(limit.getCategory())
                    .limitTry(limit.getLimitTry())
                    .spentTry(totalSpent)
                    .alertLevel(calculateLimitStatus(totalSpent, limit.getLimitTry()))
                    .build();
        }).toList();
    }

    private BigDecimal calculateIncomesMonthly(UUID userId, Integer month, Integer year) {
        return transactionRepository.sumAmountByUserIdAndMonthAndYearAndType(
                        userId, month, year, com.alpeerkaraca.fintrackserver.model.TransactionType.INCOME)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal calculateExpensesMonthly(UUID userId, Integer month, Integer year) {

        BigDecimal nonInstallmentExpenses = transactionRepository.sumAmountByUserIdAndMonthAndYearAndType(
                        userId, month, year, com.alpeerkaraca.fintrackserver.model.TransactionType.EXPENSE)
                .orElse(BigDecimal.ZERO);

        BigDecimal installmentExpenses = calculateInstallmentExpenses(userId, month, year);

        return nonInstallmentExpenses.add(installmentExpenses);


    }

    private BigDecimal calculateInstallmentExpenses(UUID userId, Integer month, Integer year) {
        List<Transaction> cardTransactions = transactionRepository.findByUserProfileIdAndPaymentMethodAndTransactionType(
                userId, PaymentMethod.CARD, TransactionType.EXPENSE);
        YearMonth targetMonth = YearMonth.of(year, month);

        return cardTransactions.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsInstallment())
                        && t.getInstallmentMeta() != null)
                .map(t -> {
                    YearMonth start = YearMonth.parse(t.getInstallmentMeta().getStartMonth());
                    YearMonth end = start.plusMonths(t.getInstallmentMeta().getMonths() - 1);
                    if (targetMonth.isBefore(start) || targetMonth.isAfter(end)) {
                        return BigDecimal.ZERO;
                    }
                    return t.getInstallmentMeta().getTotalTry()
                            .divide(BigDecimal.valueOf(t.getInstallmentMeta().getMonths()), 2, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String getAlertStatus(BigDecimal income, BigDecimal expense) {
        if (income.compareTo(BigDecimal.ZERO) == 0) return ALERT_DANGER;
        BigDecimal ratio = expense.divide(income, 2, RoundingMode.HALF_UP);
        if (ratio.doubleValue() >= ALERT_DANGER_THRESHOLD) return ALERT_DANGER;
        if (ratio.doubleValue() >= ALERT_WARNING_THRESHOLD) return ALERT_WARNING;
        return ALERT_STABLE;
    }

    private String calculateLimitStatus(BigDecimal totalSpent, BigDecimal limitTry) {
        if (limitTry.compareTo(BigDecimal.ZERO) == 0) return LIMIT_NORMAL;
        double ratio = totalSpent.divide(limitTry, 2, RoundingMode.HALF_UP).doubleValue();

        if (ratio >= Double.parseDouble(LIMIT_DANGER_THRESHOLD)) return LIMIT_DANGER;
        if (ratio >= Double.parseDouble(LIMIT_WARNING_THRESHOLD)) return LIMIT_WARNING;
        return LIMIT_NORMAL;
    }
}
