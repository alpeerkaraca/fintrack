package com.alpeerkaraca.fintrackserver.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transactions",
indexes = {
        @Index(name = "idx_tx_user_date", columnList = "user_profile_id, date"),
        @Index(name = "idx_tx_user_category", columnList = "user_profile_id, category, date")
})

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amountTry;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isInstallment = false;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "totalTry", column = @Column(name = "total_try", precision = 19, scale = 2)),
            @AttributeOverride(name = "months", column = @Column(name = "months")),
            @AttributeOverride(name = "startMonth", column = @Column(name = "start_month"))
    })
    private InstallmentMeta installmentMeta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", nullable = false)
    @JsonIgnoreProperties({"transactions", "password"})
    private UserProfile userProfile;
}
