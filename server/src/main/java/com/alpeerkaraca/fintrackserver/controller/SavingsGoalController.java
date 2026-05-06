package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import com.alpeerkaraca.fintrackserver.dto.SavingsGoalCreateRequest;
import com.alpeerkaraca.fintrackserver.dto.SavingsGoalDto;
import com.alpeerkaraca.fintrackserver.security.UserPrincipal;
import com.alpeerkaraca.fintrackserver.service.SavingsGoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/savings-goals")
@RequiredArgsConstructor
public class SavingsGoalController {
    private final SavingsGoalService savingsGoalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavingsGoalDto>>> getGoals(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Savings goals retrieved successfully",
                savingsGoalService.getGoals(userPrincipal.id())
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavingsGoalDto>> createGoal(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody SavingsGoalCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Savings goal created successfully",
                savingsGoalService.createGoal(userPrincipal.id(), request)
        ));
    }
}
