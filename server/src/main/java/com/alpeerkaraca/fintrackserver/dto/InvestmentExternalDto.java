package com.alpeerkaraca.fintrackserver.dto;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public record InvestmentExternalDto (
        String name,
        BigDecimal price
){
}
