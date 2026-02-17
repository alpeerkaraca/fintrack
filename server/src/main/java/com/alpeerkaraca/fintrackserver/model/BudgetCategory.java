package com.alpeerkaraca.fintrackserver.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(
        name = "budget_categories",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_budget_user_month_category",
                columnNames = {"user_profile_id", "budget_month_id", "category"}
        ),
        indexes = {
                @Index(name = "idx_budget_category_user_month", columnList = "user_profile_id, budget_month_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "budget_month_id", nullable = false)
    private BudgetMonth budgetMonth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal limitTry;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal spentTry;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_profile_id", nullable = false)
    private UserProfile userProfile;
}
