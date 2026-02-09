package com.alpeerkaraca.fintrackserver.dto;

import com.alpeerkaraca.fintrackserver.model.InstallmentMeta;
import com.alpeerkaraca.fintrackserver.model.PaymentMethod;
import com.alpeerkaraca.fintrackserver.model.TransactionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDto {
    private UUID id;

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotNull
    @DecimalMin(value = "0.01", inclusive = true, message = "amount must be positive")
    @Digits(integer = 20, fraction = 2)
    private BigDecimal amountTry;

    @NotBlank
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "date must be in yyyy-MM-dd format")
    private String date;

    @NotBlank
    @Size(max = 255)
    private String category;

    @NotNull
    private TransactionType type;

    @NotNull
    private PaymentMethod paymentMethod;

    @NotNull
    private Boolean isInstallment;

    @Valid
    private InstallmentMeta installmentMeta;

    @AssertTrue(message = "installmentMeta must be provided when isInstallment is true")
    private boolean isInstallmentMetaValid() {
        if (Boolean.TRUE.equals(isInstallment)) {
            return installmentMeta != null;
        }
        return true;
    }
}