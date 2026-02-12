package com.alpeerkaraca.fintrackserver.controller;

import com.alpeerkaraca.fintrackserver.dto.*;
import com.alpeerkaraca.fintrackserver.security.UserPrincipal;
import com.alpeerkaraca.fintrackserver.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getDashboardOverview(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam Integer month,
            @RequestParam Integer year,
            @PageableDefault(size = 10) Pageable pageable) {

        UUID userId = userPrincipal.id();

        DashboardOverviewCore core = dashboardService.getOverviewCore(userId, month, year);
        DashboardOverviewResponse response = dashboardService.getOverview(userId, month, year, pageable, core);

        return ResponseEntity.ok(ApiResponse.success("Dashboard overview retrieved successfully", response));
    }

}
