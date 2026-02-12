package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import com.alpeerkaraca.fintrackserver.dto.InvestmentAssetDto;
import com.alpeerkaraca.fintrackserver.dto.frontend.InvestmentCreateRequest;
import com.alpeerkaraca.fintrackserver.dto.frontend.InvestmentUpdateRequest;
import com.alpeerkaraca.fintrackserver.security.UserPrincipal;
import com.alpeerkaraca.fintrackserver.service.InvestmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/investments")
public class InvestmentsController {

    private final InvestmentService investmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvestmentAssetDto>>> getInvestments(
            @AuthenticationPrincipal UserPrincipal userPrincipal
            ) {
        UUID userId = userPrincipal.id();
        List<InvestmentAssetDto> userPortfolio = investmentService.getUserPortfolio(userId);
        return ResponseEntity.ok(ApiResponse.success("User investments retrieved successfully", userPortfolio));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvestmentAssetDto>> addInvestment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody InvestmentCreateRequest dto
    ) {
        UUID userId = userPrincipal.id();
        InvestmentAssetDto createdInvestment = investmentService.addInvestment(userId, dto);
        return ResponseEntity.ok(ApiResponse.success("Investment added successfully", createdInvestment));
    }

    @PatchMapping("/{assetId}")
    public ResponseEntity<ApiResponse<InvestmentAssetDto>> updateInvestment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody InvestmentUpdateRequest dto,
            @PathVariable UUID assetId

    ) {
        UUID userId = userPrincipal.id();
        InvestmentAssetDto updatedInvestment = investmentService.updateInvestment(userId, dto, assetId);
        return ResponseEntity.ok(ApiResponse.success("Investment updated successfully", updatedInvestment));
    }

    @DeleteMapping("/{assetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<ApiResponse<Void>> deleteInvestment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID assetId
    ) {
        UUID userId = userPrincipal.id();
        investmentService.deleteInvestment(userId, assetId);
        return ResponseEntity.noContent().build();


    }
}
