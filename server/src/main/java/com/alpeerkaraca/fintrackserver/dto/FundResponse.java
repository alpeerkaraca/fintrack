package com.alpeerkaraca.fintrackserver.dto;

import java.math.BigDecimal;

public record FundResponse(
        BigDecimal price,
        Fund fund
) {
    private record Fund (
            String title,
            String founder
    ) {}
}
