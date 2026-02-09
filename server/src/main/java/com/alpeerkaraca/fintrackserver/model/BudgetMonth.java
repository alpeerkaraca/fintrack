package com.alpeerkaraca.fintrackserver.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "budget_months")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetMonth {
    @Id
    @Column(name = "month_id")
    private String monthId;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private BigDecimal incomeTry;

    @Column(nullable = false)
    private BigDecimal expenseTry;

    @Column(nullable = false)
    private BigDecimal netSavingsTry;

    @OneToMany(mappedBy = "budgetMonth", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BudgetCategory> categories = new ArrayList<>();
}
