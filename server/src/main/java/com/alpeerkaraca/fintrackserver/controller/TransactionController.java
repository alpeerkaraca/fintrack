package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import com.alpeerkaraca.fintrackserver.dto.TransactionDto;
import com.alpeerkaraca.fintrackserver.dto.TransactionFilter;
import com.alpeerkaraca.fintrackserver.dto.frontend.CategoryResponse;
import com.alpeerkaraca.fintrackserver.model.Category;
import com.alpeerkaraca.fintrackserver.security.UserPrincipal;
import com.alpeerkaraca.fintrackserver.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {


    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionDto>>> getTransactions(
            TransactionFilter transactionFilter,
            Pageable pageable,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Page<TransactionDto> res = transactionService.getFilteredTransactions(
                userPrincipal.id(),
                transactionFilter,
                pageable,
                true);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionDto>> createTransaction(
            @Valid @RequestBody TransactionDto transactionDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        TransactionDto res = transactionService.createTransaction(
                userPrincipal.id(),
                transactionDto);

        return ResponseEntity.ok(ApiResponse.success(res));
    }
}
