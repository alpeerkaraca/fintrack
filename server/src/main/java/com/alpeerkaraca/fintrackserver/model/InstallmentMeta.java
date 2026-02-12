package com.alpeerkaraca.fintrackserver.model;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InstallmentMeta {
    @NotNull
    @Positive
    private BigDecimal totalTry;
    @NotNull
    @Min(2)
    private Integer months;
    @NotBlank
    @Pattern(regexp = "^(\\d{4})-(0[1-9]|1[0-2])$")
    private String startMonth;
}
