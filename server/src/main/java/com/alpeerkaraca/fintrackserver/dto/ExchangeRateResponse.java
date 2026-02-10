package com.alpeerkaraca.fintrackserver.dto;

import java.math.BigDecimal;

public record ExchangeRateResponse (
        String result,
        String base_code,
        String target_code,
        BigDecimal conversion_rate

) {
}
