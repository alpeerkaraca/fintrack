package com.alpeerkaraca.fintrackserver.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "investment_assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentAsset {
    @Id
    private String symbol;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(nullable = false)
    private BigDecimal avgCostTry;

    @Column(nullable = false)
    private BigDecimal currentPriceTry;

    @Column(nullable = false)
    private BigDecimal changePercent;

    @Column(nullable = false)
    private BigDecimal profitLossTry;
}
