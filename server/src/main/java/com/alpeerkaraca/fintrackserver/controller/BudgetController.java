package com.alpeerkaraca.fintrackserver.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import com.alpeerkaraca.fintrackserver.dto.BudgetCategoryResponse;
import com.alpeerkaraca.fintrackserver.dto.BudgetSummaryDto;
import com.alpeerkaraca.fintrackserver.dto.ForecastResponse;
import com.alpeerkaraca.fintrackserver.security.UserPrincipal;
import com.alpeerkaraca.fintrackserver.service.BudgetService;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<BudgetSummaryDto>> getBudgetSummary(
            @RequestParam Integer month,
            @RequestParam Integer year,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudgetSummary(userPrincipal.id(), month, year)));
    }

    @GetMapping("/forecast")
    public ResponseEntity<ApiResponse<List<ForecastResponse>>> getBudgetForecast(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudgetForecast(userPrincipal.id())));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<String>> getBudgetAlert(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudgetAlerts(userPrincipal.id())));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<BudgetCategoryResponse>>> getBudgetCategories(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getCategoryWatchlist(userPrincipal.id(), month, year)));
    }

}
