package com.alpeerkaraca.fintrackserver.Model;

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
    @Column(nullable = false)
    private BigDecimal totalTry;

    @Column(nullable = false)
    private Integer months;

    @Column(nullable = false)
    private String startMonth;
}
