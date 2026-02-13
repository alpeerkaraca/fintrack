package com.alpeerkaraca.fintrackserver.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "budget_months",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_budget_month_user_year_month",
                columnNames = {"user_profile_id", "year", "month"}
        ),
        indexes = {
                @Index(name = "idx_budget_month_user_year_month", columnList = "user_profile_id, year, month"),
                @Index(name = "idx_budget_month_user_year", columnList = "user_profile_id, year")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetMonth {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_profile_id", nullable = false)
    private UserProfile userProfile;

    @Column(nullable = false)
    private int year;

    @Column(name = "\"month\"", nullable = false)
    private int month;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal incomeTry;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal expenseTry;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal netSavingsTry;

    @OneToMany(mappedBy = "budgetMonth", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BudgetCategory> categories = new ArrayList<>();
}
