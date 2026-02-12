package com.alpeerkaraca.fintrackserver.dto.frontend;

import com.alpeerkaraca.fintrackserver.model.InstallmentMeta;
import com.alpeerkaraca.fintrackserver.model.PaymentMethod;
import com.alpeerkaraca.fintrackserver.model.TransactionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionUpdateRequest {

    @NotBlank
    private String title;

    @NotNull
    @Positive
    private BigDecimal amountTry;

    @NotBlank
    private String date;

    @NotBlank
    private String category;

    @NotNull
    private TransactionType type;

    private PaymentMethod paymentMethod;

    private Boolean isInstallment;

    @Valid
    private InstallmentMeta installmentMeta;
}
