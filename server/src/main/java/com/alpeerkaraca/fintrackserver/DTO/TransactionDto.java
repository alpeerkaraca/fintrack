package com.alpeerkaraca.fintrackserver.DTO;

import com.alpeerkaraca.fintrackserver.Model.InstallmentMeta;
import com.alpeerkaraca.fintrackserver.Model.PaymentMethod;
import com.alpeerkaraca.fintrackserver.Model.TransactionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDto {
    private String id;

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