package com.alpeerkaraca.fintrackserver.dto;

import com.alpeerkaraca.fintrackserver.model.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionFilter {
    private Integer month;
    private Integer year;
    private TransactionType type;
    private String category;
    @Builder.Default
    private boolean expanded = true;
}
