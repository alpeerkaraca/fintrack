package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.frontend.ReportSummaryResponse;
import com.alpeerkaraca.fintrackserver.model.Transaction;
import com.alpeerkaraca.fintrackserver.model.TransactionType;
import com.alpeerkaraca.fintrackserver.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final TransactionRepository transactionRepository;

    @Cacheable(value = "reportSummary", key = "#userId + '_' + #startDate + '_' + #endDate")
    public ReportSummaryResponse getReportSummary(UUID userId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = transactionRepository.findByUserProfileIdAndDateBetween(userId, startDate, endDate);

        BigDecimal totalIncome = calculateTotalByType(transactions, TransactionType.INCOME);
        BigDecimal totalExpense = calculateTotalByType(transactions, TransactionType.EXPENSE);
        BigDecimal netSavings = totalIncome.subtract(totalExpense);
        Double savingsRate = calculateSavingsRate(totalIncome, netSavings);

        long monthsDiff = calculateMonthDifference(startDate, endDate);
        BigDecimal avgIncome = calculateAverage(totalIncome, monthsDiff);
        BigDecimal avgExpense = calculateAverage(totalExpense, monthsDiff);
        BigDecimal avgSavings = calculateAverage(netSavings, monthsDiff);


        List<ReportSummaryResponse.MonthlySeriesItem> monthlySeries = generateMonthlySeries(transactions, startDate, endDate);
        List<ReportSummaryResponse.CategoryBreakdownItem> categoryBreakdown = generateCategoryBreakdown(transactions);
        ReportSummaryResponse.CategoryBreakdownItem topCategory = categoryBreakdown.isEmpty() ? null : categoryBreakdown.getFirst();

        return ReportSummaryResponse.builder()
                .currency("TRY")
                .range(ReportSummaryResponse.DateRange.builder()
                        .start(startDate.toString())
                        .end(endDate.toString())
                        .build())
                .totals(ReportSummaryResponse.ReportTotals.builder()
                        .incomeTry(totalIncome)
                        .expenseTry(totalExpense)
                        .netSavingsTry(netSavings)
                        .savingsRatePct(savingsRate)
                        .build())
                .averages(ReportSummaryResponse.ReportAverages.builder()
                        .monthlyIncomeTry(avgIncome)
                        .monthlyExpenseTry(avgExpense)
                        .monthlySavingsTry(avgSavings)
                        .build())
                .monthlySeries(monthlySeries)
                .categoryBreakdown(categoryBreakdown)
                .topCategory(topCategory)
                .metadata(ReportSummaryResponse.ReportMetadata.builder()
                        .generatedAt(LocalDateTime.now())
                        .dataPoints(ReportSummaryResponse.ReportMetadata.DataPoints.builder()
                                .transactions(transactions.size())
                                .months(monthsDiff)
                                .categories(categoryBreakdown.size())
                                .build())
                        .build())
                .build();
    }

    private BigDecimal calculateTotalByType(List<Transaction> transactions, TransactionType type) {
        if (transactions == null || transactions.isEmpty()) return BigDecimal.ZERO;

        return transactions.stream()
                .filter(t -> t.getTransactionType() == type)
                .map(Transaction::getAmountTry)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateAverage(BigDecimal total, long months) {
        if (months <= 0) return BigDecimal.ZERO;
        return total.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
    }

    private Double calculateSavingsRate(BigDecimal totalIncome, BigDecimal netSavings) {
        if (totalIncome.compareTo(BigDecimal.ZERO) == 0) return 0.0;

        return netSavings.divide(totalIncome, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private long calculateMonthDifference(LocalDate start, LocalDate end) {
        long diff = ChronoUnit.MONTHS.between(YearMonth.from(start), YearMonth.from(end)) + 1;
        return Math.max(diff, 1);
    }


    private List<ReportSummaryResponse.MonthlySeriesItem> generateMonthlySeries(
            List<Transaction> transactions, LocalDate startDate, LocalDate endDate) {

        Map<YearMonth, List<Transaction>> groupedByMonth = transactions.stream()
                .collect(Collectors.groupingBy(t -> YearMonth.from(t.getDate())));

        List<ReportSummaryResponse.MonthlySeriesItem> series = new ArrayList<>();
        YearMonth currentMonth = YearMonth.from(startDate);
        YearMonth endMonth = YearMonth.from(endDate);

        while (!currentMonth.isAfter(endMonth)) {
            List<Transaction> monthTrans = groupedByMonth.getOrDefault(currentMonth, Collections.emptyList());

            BigDecimal mIncome = calculateTotalByType(monthTrans, TransactionType.INCOME);
            BigDecimal mExpense = calculateTotalByType(monthTrans, TransactionType.EXPENSE);

            series.add(ReportSummaryResponse.MonthlySeriesItem.builder()
                    .month(currentMonth.toString())
                    .label(currentMonth.format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH)))
                    .incomeTry(mIncome)
                    .expenseTry(mExpense)
                    .netSavingsTry(mIncome.subtract(mExpense))
                    .build());

            currentMonth = currentMonth.plusMonths(1);
        }
        return series;
    }


    private List<ReportSummaryResponse.CategoryBreakdownItem> generateCategoryBreakdown(List<Transaction> transactions) {
        Map<String, BigDecimal> categoryMap = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getLabel(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmountTry, BigDecimal::add)
                ));

        return categoryMap.entrySet().stream()
                .map(entry -> ReportSummaryResponse.CategoryBreakdownItem.builder()
                        .categoryId(formatCategoryId(entry.getKey()))
                        .categoryLabel(entry.getKey())
                        .totalTry(entry.getValue())
                        .build())
                .sorted((c1, c2) -> c2.getTotalTry().compareTo(c1.getTotalTry()))
                .toList();
    }

    private String formatCategoryId(String categoryName) {
        return categoryName.trim().toUpperCase(Locale.ENGLISH).replace(" ", "_");
    }

}
