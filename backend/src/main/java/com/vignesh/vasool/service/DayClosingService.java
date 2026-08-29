package com.vignesh.vasool.service;

import com.vignesh.vasool.dto.DayClosingResponse;
import com.vignesh.vasool.entity.DayClosing;
import com.vignesh.vasool.entity.LoanPhase;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.CollectionEntryRepository;
import com.vignesh.vasool.repository.DayClosingRepository;
import com.vignesh.vasool.repository.ExpenseRepository;
import com.vignesh.vasool.repository.LoanPhaseRepository;
import com.vignesh.vasool.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Day-closing (mun-irupu) calculation, scoped per organization:
 *   a = openingBalance + totalCollection + totalAadhaiyam + additionalInvestment
 *   b = a - totalAdapu
 *   c = b - totalExpenses -> closingBalance -> tomorrow's opening mun-irupu
 *
 * openingBalance normally comes from yesterday's closingBalance automatically,
 * but can be manually overridden (e.g. to correct a mistake) via
 * openingBalanceOverride on preview/close.
 */
@Service
@RequiredArgsConstructor
public class DayClosingService {

    private final DayClosingRepository dayClosingRepository;
    private final CollectionEntryRepository collectionEntryRepository;
    private final ExpenseRepository expenseRepository;
    private final LoanPhaseRepository loanPhaseRepository;
    private final UserRepository userRepository;

    @Transactional
    public DayClosingResponse closeDay(LocalDate date, BigDecimal additionalInvestment, BigDecimal openingBalanceOverride, Long orgId) {
        if (dayClosingRepository.findByClosingDateAndOrganizationOwnerId(date, orgId).isPresent()) {
            throw new IllegalStateException("Day " + date + " is already closed. Reopen it first if you need to redo it.");
        }

        Totals t = computeTotals(date, additionalInvestment, openingBalanceOverride, orgId);

        DayClosing closing = DayClosing.builder()
                .closingDate(date)
                .organizationOwnerId(orgId)
                .openingBalance(t.openingBalance)
                .totalCollection(t.totalCollection)
                .totalAadhaiyam(t.totalAadhaiyam)
                .totalAdapu(t.totalAdapu)
                .totalExpenses(t.totalExpenses)
                .additionalInvestment(t.additionalInvestment)
                .closingBalance(t.closingBalance)
                .closed(true)
                .build();

        dayClosingRepository.save(closing);
        return toResponse(t, date, true);
    }

    public DayClosingResponse previewDay(LocalDate date, BigDecimal additionalInvestment, BigDecimal openingBalanceOverride, Long orgId) {
        Totals t = computeTotals(date, additionalInvestment, openingBalanceOverride, orgId);
        return toResponse(t, date, false);
    }

    private Totals computeTotals(LocalDate date, BigDecimal additionalInvestment, BigDecimal openingBalanceOverride, Long orgId) {
        BigDecimal openingBalance;
        if (openingBalanceOverride != null) {
            openingBalance = openingBalanceOverride;
        } else {
            openingBalance = dayClosingRepository
                    .findTopByClosingDateBeforeAndOrganizationOwnerIdOrderByClosingDateDesc(date, orgId)
                    .map(DayClosing::getClosingBalance)
                    .orElse(BigDecimal.ZERO);
        }

        BigDecimal totalCollection = collectionEntryRepository.sumAmountByDate(date, orgId);
        BigDecimal totalExpenses = expenseRepository.sumAmountByDate(date, orgId);
        BigDecimal addlInvestment = additionalInvestment != null ? additionalInvestment : BigDecimal.ZERO;

        List<LoanPhase> phasesToday = loanPhaseRepository.findByStartDateAndOrganizationOwnerId(date, orgId);
        BigDecimal totalAadhaiyam = phasesToday.stream()
                .map(LoanPhase::getAadhaiyam)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAdapu = phasesToday.stream()
                .map(LoanPhase::getAdapu)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal a = openingBalance.add(totalCollection).add(totalAadhaiyam).add(addlInvestment);
        BigDecimal b = a.subtract(totalAdapu);
        BigDecimal c = b.subtract(totalExpenses);

        Totals t = new Totals();
        t.openingBalance = openingBalance;
        t.totalCollection = totalCollection;
        t.totalAadhaiyam = totalAadhaiyam;
        t.totalAdapu = totalAdapu;
        t.totalExpenses = totalExpenses;
        t.additionalInvestment = addlInvestment;
        t.closingBalance = c;
        return t;
    }

    @Transactional
    public void reopenDay(LocalDate date, Long orgId) {
        DayClosing closing = dayClosingRepository.findByClosingDateAndOrganizationOwnerId(date, orgId)
                .orElseThrow(() -> new IllegalArgumentException("No closing found for " + date));
        dayClosingRepository.delete(closing);
    }

    @Transactional
    public DayClosingResponse setInitialInvestment(LocalDate date, BigDecimal amount, Long orgId) {
        if (dayClosingRepository.findTopByClosingDateBeforeAndOrganizationOwnerIdOrderByClosingDateDesc(date, orgId).isPresent()) {
            throw new IllegalStateException("Initial investment can only be set before any day has been closed.");
        }
        DayClosing closing = DayClosing.builder()
                .closingDate(date.minusDays(1))
                .organizationOwnerId(orgId)
                .openingBalance(BigDecimal.ZERO)
                .totalCollection(BigDecimal.ZERO)
                .totalAadhaiyam(BigDecimal.ZERO)
                .totalAdapu(BigDecimal.ZERO)
                .totalExpenses(BigDecimal.ZERO)
                .additionalInvestment(BigDecimal.ZERO)
                .closingBalance(amount)
                .closed(true)
                .build();
        dayClosingRepository.save(closing);
        return toResponse(null, date.minusDays(1), true, closing);
    }

    public BigDecimal getTodayCollectionTotal(Long orgId) {
        return collectionEntryRepository.sumAmountByDate(LocalDate.now(), orgId);
    }

    private DayClosingResponse toResponse(Totals t, LocalDate date, boolean closed) {
        return DayClosingResponse.builder()
                .date(date)
                .openingBalance(t.openingBalance)
                .totalCollection(t.totalCollection)
                .totalAadhaiyam(t.totalAadhaiyam)
                .totalAdapu(t.totalAdapu)
                .totalExpenses(t.totalExpenses)
                .additionalInvestment(t.additionalInvestment)
                .closingBalance(t.closingBalance)
                .closed(closed)
                .build();
    }

    private DayClosingResponse toResponse(Totals ignored, LocalDate date, boolean closed, DayClosing c) {
        return DayClosingResponse.builder()
                .date(date)
                .openingBalance(c.getOpeningBalance())
                .totalCollection(c.getTotalCollection())
                .totalAadhaiyam(c.getTotalAadhaiyam())
                .totalAdapu(c.getTotalAdapu())
                .totalExpenses(c.getTotalExpenses())
                .additionalInvestment(c.getAdditionalInvestment())
                .closingBalance(c.getClosingBalance())
                .closed(closed)
                .build();
    }

    private static class Totals {
        BigDecimal openingBalance;
        BigDecimal totalCollection;
        BigDecimal totalAadhaiyam;
        BigDecimal totalAdapu;
        BigDecimal totalExpenses;
        BigDecimal additionalInvestment;
        BigDecimal closingBalance;
    }

    @Scheduled(cron = "0 59 23 * * *", zone = "Asia/Kolkata")
    public void autoCloseDayIfNeeded() {
        LocalDate today = LocalDate.now();
        Set<Long> orgIds = userRepository.findAll().stream()
                .map(User::getOrganizationOwnerId)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        for (Long orgId : orgIds) {
            if (dayClosingRepository.findByClosingDateAndOrganizationOwnerId(today, orgId).isEmpty()) {
                closeDay(today, null, null, orgId);
            }
        }
    }
}
