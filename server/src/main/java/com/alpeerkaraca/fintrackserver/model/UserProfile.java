package com.alpeerkaraca.fintrackserver.model;

import jakarta.persistence.*;
import lombok.*;
import net.minidev.json.annotate.JsonIgnore;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_profiles",
        uniqueConstraints = {
                @UniqueConstraint(name = "uc_user_username", columnNames = {"username"}),
                @UniqueConstraint(name = "uc_user_email", columnNames = {"email"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, unique = true)
    private String username;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password;
    @Column(nullable = false, precision = 12, scale = 6)
    private BigDecimal netSalaryUsd;
    @Column(nullable = false)
    @Builder.Default
    private BigDecimal creditCardLimitTry = BigDecimal.ZERO;
    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Transaction> transactions;

    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<BudgetCategory> budgetCategories;

    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<InvestmentAsset> investmentAssets;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
