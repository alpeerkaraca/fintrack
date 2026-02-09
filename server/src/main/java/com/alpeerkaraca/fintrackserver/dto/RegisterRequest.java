package com.alpeerkaraca.fintrackserver.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RegisterRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 40, message = "Username must be 3-40 characters")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email format is invalid")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$",
                message = "Password must include uppercase, lowercase, number, and symbol"
        )
        String password,

        @NotNull(message = "Net salary is required")
        @DecimalMin(value = "0.01", message = "Net salary must be greater than 0")
        BigDecimal netSalaryUsd
) {
}
