package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.frontend.CategoryResponse;
import com.alpeerkaraca.fintrackserver.dto.frontend.MonthOptionResponse;
import com.alpeerkaraca.fintrackserver.dto.frontend.StockMarketResponse;
import com.alpeerkaraca.fintrackserver.model.Category;
import com.alpeerkaraca.fintrackserver.model.StockMarket;
import com.alpeerkaraca.fintrackserver.repository.BudgetMonthRepository;
import com.alpeerkaraca.fintrackserver.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MetadataService {
    private final TransactionRepository transactionRepository;
    private final BudgetMonthRepository budgetMonthRepository;

    private static final DateTimeFormatter MONTH_LABEL_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);


    public List<CategoryResponse> getAvailableCategories() {
        return Arrays.stream(Category.values())
                .map(cat -> new CategoryResponse(
                        cat.name(),
                        cat.getLabel(),
                        cat.getIcon()
                )).toList().stream().sorted(Comparator.comparing(CategoryResponse::label)).toList();
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

    public List<MonthOptionResponse> getAvailableMonths(UUID userId) {
        Set<YearMonth> months = new HashSet<>();
        
        // Always include current month
        months.add(YearMonth.now());

        // From transactions
        transactionRepository.findDistinctTransactionMonths(userId).forEach(row -> {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            months.add(YearMonth.of(year, month));
        });

        // From budget records
        budgetMonthRepository.findDistinctBudgetMonths(userId).forEach(row -> {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            months.add(YearMonth.of(year, month));
        });

        return months.stream()
                .sorted(Comparator.reverseOrder())
                .map(ym -> new MonthOptionResponse(
                        ym.toString(), // e.g. "2026-03"
                        ym.format(MONTH_LABEL_FORMAT) // e.g. "Mar 2026"
                ))
                .toList();
    }
}
