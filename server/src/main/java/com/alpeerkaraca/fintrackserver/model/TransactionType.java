package com.alpeerkaraca.fintrackserver.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TransactionType {
    INCOME, EXPENSE;

    @JsonCreator
    public static TransactionType from(String value) {
        return TransactionType.valueOf(value.trim().toUpperCase());
    }

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

}
