package com.vignesh.vasool.service;

import com.vignesh.vasool.dto.LoanPhaseRequest;
import com.vignesh.vasool.entity.Category;
import com.vignesh.vasool.entity.Customer;
import com.vignesh.vasool.entity.LoanPhase;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.CategoryRepository;
import com.vignesh.vasool.repository.CustomerRepository;
import com.vignesh.vasool.repository.LoanPhaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Handles disbursement (a new loan phase for a customer under a category).
 *
 * Default calculation (matches the "per 1000" business rule):
 *   aadhaiyam    = adapu * (deductionRatePer1000 / 1000)   e.g. 10000 * 50/1000  = 500
 *   totalPayable = adapu * (repayRatePer1000     / 1000)   e.g. 10000 * 1200/1000 = 12000
 *   customer actually receives: adapu - aadhaiyam           e.g. 10000 - 500      = 9500
 *
 * Staff can override aadhaiyam and/or totalPayable manually; when they do,
 * autoCalculated is set to false so reports can flag it was a manual entry.
 */
@Service
@RequiredArgsConstructor
public class LoanPhaseService {

    private final LoanPhaseRepository loanPhaseRepository;
    private final CustomerRepository customerRepository;
    private final CategoryRepository categoryRepository;

    public LoanPhase disburse(LoanPhaseRequest request, User disbursedBy) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + request.getCustomerId()));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));

        BigDecimal adapu = request.getAdapu();
        if (adapu == null || adapu.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("adapu (principal amount) must be greater than zero");
        }

        boolean autoCalculated = request.getAadhaiyamOverride() == null && request.getTotalPayableOverride() == null;

        BigDecimal aadhaiyam = request.getAadhaiyamOverride() != null
                ? request.getAadhaiyamOverride()
                : adapu.multiply(category.getDeductionRatePer1000())
                        .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);

        BigDecimal totalPayable = request.getTotalPayableOverride() != null
                ? request.getTotalPayableOverride()
                : adapu.multiply(category.getRepayRatePer1000())
                        .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);

        int phaseNumber = loanPhaseRepository.countByCustomerIdAndCategoryId(customer.getId(), category.getId()) + 1;

        LoanPhase phase = LoanPhase.builder()
                .customer(customer)
                .category(category)
                .adapu(adapu)
                .aadhaiyam(aadhaiyam)
                .totalPayable(totalPayable)
                .autoCalculated(autoCalculated)
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .standardDays(category.getStandardDays())
                .phaseNumber(phaseNumber)
                .status(LoanPhase.PhaseStatus.ACTIVE)
                .disbursedBy(disbursedBy)
                .build();

        return loanPhaseRepository.save(phase);
    }

    /** Amount the customer actually walks away with (adapu - aadhaiyam). */
    public BigDecimal amountReceivedByCustomer(LoanPhase phase) {
        return phase.getAdapu().subtract(phase.getAadhaiyam());
    }

    public List<LoanPhase> getActivePhasesForCustomer(Long customerId) {
        return loanPhaseRepository.findByCustomerIdAndStatusInWithCategory(
                customerId, List.of(LoanPhase.PhaseStatus.ACTIVE, LoanPhase.PhaseStatus.OVERDUE));
    }

    public List<LoanPhase> getAllPhasesForCustomer(Long customerId) {
        return loanPhaseRepository.findByCustomerId(customerId);
    }

    /** All currently active/overdue loan phases across every customer - used for the Excel export. */
    public List<LoanPhase> getAllActiveAndOverduePhases() {
        return loanPhaseRepository.findByStatusInWithCustomer(List.of(LoanPhase.PhaseStatus.ACTIVE, LoanPhase.PhaseStatus.OVERDUE));
    }

    public List<LoanPhase> getPhasesDisbursedOn(LocalDate date) {
        return loanPhaseRepository.findByStartDate(date);
    }

    /**
     * Flags phases that have crossed their standardDays window as OVERDUE.
     * Per the business rule: crossing day 60 (or whatever standardDays is)
     * does NOT add extra interest - it just means collection continues
     * until totalPayable is fully recovered.
     */
    public void markOverduePhases() {
        List<LoanPhase> active = loanPhaseRepository.findByStatus(LoanPhase.PhaseStatus.ACTIVE);
        LocalDate today = LocalDate.now();
        for (LoanPhase phase : active) {
            if (phase.getStartDate().plusDays(phase.getStandardDays()).isBefore(today)) {
                phase.setStatus(LoanPhase.PhaseStatus.OVERDUE);
                loanPhaseRepository.save(phase);
            }
        }
    }

    public LoanPhase getById(Long id) {
        return loanPhaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan phase not found: " + id));
    }
}