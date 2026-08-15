package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.LoanPhaseRequest;
import com.vignesh.vasool.entity.LoanPhase;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.service.LoanPhaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loan-phases")
@RequiredArgsConstructor
public class LoanPhaseController {

    private final LoanPhaseService loanPhaseService;

    @PostMapping
    public LoanPhase disburse(@Valid @RequestBody LoanPhaseRequest request,
                               @AuthenticationPrincipal User currentUser) {
        return loanPhaseService.disburse(request, currentUser);
    }

    @GetMapping("/customer/{customerId}/active")
    public List<LoanPhase> getActiveForCustomer(@PathVariable Long customerId) {
        return loanPhaseService.getActivePhasesForCustomer(customerId);
    }

    @GetMapping("/customer/{customerId}/all")
    public List<LoanPhase> getAllForCustomer(@PathVariable Long customerId) {
        return loanPhaseService.getAllPhasesForCustomer(customerId);
    }

    @GetMapping("/all-active")
    public List<LoanPhase> getAllActive() {
        return loanPhaseService.getAllActiveAndOverduePhases();
    }

    @GetMapping("/{id}")
    public LoanPhase getById(@PathVariable Long id) {
        return loanPhaseService.getById(id);
    }
}