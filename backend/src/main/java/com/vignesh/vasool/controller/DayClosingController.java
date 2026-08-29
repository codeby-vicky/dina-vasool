package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.DayClosingResponse;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.service.DayClosingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/day-closing")
@RequiredArgsConstructor
public class DayClosingController {

    private final DayClosingService dayClosingService;

    @GetMapping("/preview")
    public DayClosingResponse preview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) BigDecimal additionalInvestment,
            @RequestParam(required = false) BigDecimal openingBalanceOverride,
            @AuthenticationPrincipal User currentUser) {
        return dayClosingService.previewDay(date, additionalInvestment, openingBalanceOverride, currentUser.getOrganizationOwnerId());
    }

    @PostMapping("/close")
    public DayClosingResponse close(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) BigDecimal additionalInvestment,
            @RequestParam(required = false) BigDecimal openingBalanceOverride,
            @AuthenticationPrincipal User currentUser) {
        return dayClosingService.closeDay(date, additionalInvestment, openingBalanceOverride, currentUser.getOrganizationOwnerId());
    }

    @PostMapping("/reopen")
    public void reopen(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                        @AuthenticationPrincipal User currentUser) {
        dayClosingService.reopenDay(date, currentUser.getOrganizationOwnerId());
    }

    @PostMapping("/initial-investment")
    public DayClosingResponse setInitialInvestment(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam BigDecimal amount,
            @AuthenticationPrincipal User currentUser) {
        return dayClosingService.setInitialInvestment(date, amount, currentUser.getOrganizationOwnerId());
    }

    @GetMapping("/today-summary")
    public Map<String, Object> todaySummary(@AuthenticationPrincipal User currentUser) {
        return Map.of(
                "date", LocalDate.now(),
                "totalCollection", dayClosingService.getTodayCollectionTotal(currentUser.getOrganizationOwnerId())
        );
    }
}
