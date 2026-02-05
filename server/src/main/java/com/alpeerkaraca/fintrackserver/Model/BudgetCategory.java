package com.alpeerkaraca.fintrackserver.Model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "budget_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_month_id", nullable = false)
    private BudgetMonth budgetMonth;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private BigDecimal limitTry;

    @Column(nullable = false)
    private BigDecimal spentTry;

}
