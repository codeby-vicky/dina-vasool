package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.DayClosingResponse;
import com.vignesh.vasool.service.DayClosingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
            @RequestParam(required = false) BigDecimal additionalInvestment) {
        return dayClosingService.previewDay(date, additionalInvestment);
    }

    @PostMapping("/close")
    public DayClosingResponse close(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) BigDecimal additionalInvestment) {
        return dayClosingService.closeDay(date, additionalInvestment);
    }

    @PostMapping("/reopen")
    public void reopen(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        dayClosingService.reopenDay(date);
    }

    @PostMapping("/initial-investment")
    public DayClosingResponse setInitialInvestment(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam BigDecimal amount) {
        return dayClosingService.setInitialInvestment(date, amount);
    }

    @GetMapping("/today-summary")
    public Map<String, Object> todaySummary() {
        return Map.of(
                "date", LocalDate.now(),
                "totalCollection", dayClosingService.getTodayCollectionTotal()
        );
    }
}
