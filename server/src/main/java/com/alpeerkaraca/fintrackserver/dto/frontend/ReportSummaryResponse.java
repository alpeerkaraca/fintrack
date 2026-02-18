package com.alpeerkaraca.fintrackserver.dto.frontend;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryResponse {
    private String currency;
    private DateRange range;
    private ReportTotals totals;
    private ReportAverages averages;
    private List<MonthlySeriesItem> monthlySeries;
    private List<CategoryBreakdownItem> categoryBreakdown;
    private CategoryBreakdownItem topCategory;
    private ReportMetadata metadata;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateRange {
        private String start;
        private String end;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportTotals {
        private BigDecimal incomeTry;
        private BigDecimal expenseTry;
        private BigDecimal netSavingsTry;
        private Double savingsRatePct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportAverages {
        private BigDecimal monthlyIncomeTry;
        private BigDecimal monthlyExpenseTry;
        private BigDecimal monthlySavingsTry;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlySeriesItem {
        private String month;      // "2026-02"
        private String label;      // "Feb 2026"
        private BigDecimal incomeTry;
        private BigDecimal expenseTry;
        private BigDecimal netSavingsTry;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBreakdownItem {
        private String categoryId;
        private String categoryLabel;
        private BigDecimal totalTry;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportMetadata {
        private LocalDateTime generatedAt;
        private DataPoints dataPoints;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class DataPoints {
            private int transactions;
            private long months;
            private int categories;
        }
    }
}