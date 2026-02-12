package com.alpeerkaraca.fintrackserver.dto;

import java.math.BigDecimal;

public record FundResponse(
        BigDecimal price,
        Fund fund
) {
    public String title() {
        return fund.title();
    }
    private record Fund (
            String title,
            String founder
    ) {

    }
}
