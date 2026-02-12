package com.alpeerkaraca.fintrackserver.dto.frontend;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {
    private String id;
    private String title;
    private BigDecimal amountTry;
    private String date;
    private String category;
    private String type;
    private String paymentMethod;
    private boolean isInstallment;
    private InstallmentMetaResponse installmentMeta;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InstallmentMetaResponse {
        private BigDecimal totalTry;
        private Integer months;
        private String startMonth;
    }
}

