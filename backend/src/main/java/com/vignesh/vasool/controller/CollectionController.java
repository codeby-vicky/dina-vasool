package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.CollectionRequest;
import com.vignesh.vasool.entity.CollectionEntry;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.service.CollectionService;
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

    @PostMapping
    public CollectionEntry record(@Valid @RequestBody CollectionRequest request,
                                   @AuthenticationPrincipal User currentUser) {
        return collectionService.record(request, currentUser);
    }

    @GetMapping
    public List<CollectionEntry> getByDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return collectionService.getByDate(date);
    }

    @GetMapping("/total")
    public Map<String, Object> getTotalForDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        BigDecimal total = collectionService.getTotalForDate(date);
        return Map.of("date", date, "totalCollection", total);
    }

    @GetMapping("/loan-phase/{loanPhaseId}")
    public List<CollectionEntry> getHistory(@PathVariable Long loanPhaseId) {
        return collectionService.getHistoryForPhase(loanPhaseId);
    }
}
