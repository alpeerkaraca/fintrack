package com.alpeerkaraca.fintrackserver.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InstallmentMeta {
    private BigDecimal totalTry;

    private Integer months;

    private String startMonth;
}
