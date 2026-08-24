package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.CollectionRequest;
import com.vignesh.vasool.entity.CollectionEntry;
import com.vignesh.vasool.entity.LoanPhase;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.service.CollectionService;
import com.vignesh.vasool.service.LoanPhaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;
    private final LoanPhaseService loanPhaseService;

    @PostMapping
    public CollectionEntry record(@Valid @RequestBody CollectionRequest request,
                                   @AuthenticationPrincipal User currentUser) {
        return collectionService.record(request, currentUser);
    }

    @GetMapping
    public List<CollectionEntry> getByDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                            @AuthenticationPrincipal User currentUser) {
        return collectionService.getByDate(date, currentUser.getOrganizationOwnerId());
    }

    @GetMapping("/total")
    public Map<String, Object> getTotalForDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                                @AuthenticationPrincipal User currentUser) {
        BigDecimal total = collectionService.getTotalForDate(date, currentUser.getOrganizationOwnerId());
        return Map.of("date", date, "totalCollection", total);
    }

    @GetMapping("/loan-phase/{loanPhaseId}")
    public List<CollectionEntry> getHistory(@PathVariable Long loanPhaseId) {
        return collectionService.getHistoryForPhase(loanPhaseId);
    }

    @GetMapping("/loan-phase/{loanPhaseId}/for-date")
    public CollectionEntry getForDate(
            @PathVariable Long loanPhaseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return collectionService.getHistoryForPhase(loanPhaseId).stream()
                .filter(e -> e.getCollectedDate().equals(date))
                .findFirst()
                .orElse(null);
    }

    @GetMapping("/range")
    public List<CollectionEntry> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @AuthenticationPrincipal User currentUser) {
        return collectionService.getByRange(start, end, currentUser.getOrganizationOwnerId());
    }

    @GetMapping("/loan-phase/{loanPhaseId}/summary")
    public Map<String, Object> getPhaseSummary(@PathVariable Long loanPhaseId) {
        LoanPhase phase = loanPhaseService.getById(loanPhaseId);
        BigDecimal outstanding = collectionService.getOutstandingBalance(phase);
        List<CollectionEntry> history = collectionService.getHistoryForPhase(loanPhaseId);

        long dayCount = java.time.temporal.ChronoUnit.DAYS.between(phase.getStartDate(), LocalDate.now());
        long remainingDays = phase.getStandardDays() - dayCount;

        return Map.of(
                "totalPayable", phase.getTotalPayable(),
                "totalCollected", phase.getTotalPayable().subtract(outstanding),
                "outstanding", outstanding.max(BigDecimal.ZERO),
                "dayCount", Math.max(dayCount, 0),
                "standardDays", phase.getStandardDays(),
                "remainingDays", Math.max(remainingDays, 0),
                "overdue", remainingDays < 0,
                "history", history
        );
    }
}
