package com.vignesh.vasool.service;

import com.vignesh.vasool.dto.DayClosingResponse;
import com.vignesh.vasool.entity.DayClosing;
import com.vignesh.vasool.entity.LoanPhase;
import com.vignesh.vasool.repository.CollectionEntryRepository;
import com.vignesh.vasool.repository.DayClosingRepository;
import com.vignesh.vasool.repository.ExpenseRepository;
import com.vignesh.vasool.repository.LoanPhaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Implements the daily mun-irupu (opening balance / investment) calculation:
 *
 *   a = openingBalance (yesterday's closingBalance)
 *       + totalCollection (today)
 *       + totalAadhaiyam (today, sum of aadhaiyam on any new/phase disbursements today)
 *       + additionalInvestment (extra money manually put in today, e.g. when mun-irupu
 *         alone isn't enough to cover today's adapu disbursements)
 *   b = a - totalAdapu (today, sum of principal disbursed today)
 *   c = b - totalExpenses (today)
 *
 *   c = closingBalance = tomorrow's opening mun-irupu / investment
 */
@Service
@RequiredArgsConstructor
public class DayClosingService {

    private final DayClosingRepository dayClosingRepository;
    private final CollectionEntryRepository collectionEntryRepository;
    private final ExpenseRepository expenseRepository;
    private final LoanPhaseRepository loanPhaseRepository;

    @Transactional
    public DayClosingResponse closeDay(LocalDate date, BigDecimal additionalInvestment) {
        if (dayClosingRepository.findByClosingDate(date).isPresent()) {
            throw new IllegalStateException("Day " + date + " is already closed. Reopen it first if you need to redo it.");
        }

        Totals t = computeTotals(date, additionalInvestment);

        DayClosing closing = DayClosing.builder()
                .closingDate(date)
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

    public DayClosingResponse previewDay(LocalDate date, BigDecimal additionalInvestment) {
        Totals t = computeTotals(date, additionalInvestment);
        return toResponse(t, date, false);
    }

    private Totals computeTotals(LocalDate date, BigDecimal additionalInvestment) {
        BigDecimal openingBalance = dayClosingRepository
                .findTopByClosingDateBeforeOrderByClosingDateDesc(date)
                .map(DayClosing::getClosingBalance)
                .orElse(BigDecimal.ZERO);

        BigDecimal totalCollection = collectionEntryRepository.sumAmountByDate(date);
        BigDecimal totalExpenses = expenseRepository.sumAmountByDate(date);
        BigDecimal addlInvestment = additionalInvestment != null ? additionalInvestment : BigDecimal.ZERO;

        List<LoanPhase> phasesToday = loanPhaseRepository.findByStartDate(date);
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
    public void reopenDay(LocalDate date) {
        DayClosing closing = dayClosingRepository.findByClosingDate(date)
                .orElseThrow(() -> new IllegalArgumentException("No closing found for " + date));
        dayClosingRepository.delete(closing);
    }

    @Transactional
    public DayClosingResponse setInitialInvestment(LocalDate date, BigDecimal amount) {
        if (!dayClosingRepository.findAll().isEmpty()) {
            throw new IllegalStateException("Initial investment can only be set before any day has been closed.");
        }
        DayClosing closing = DayClosing.builder()
                .closingDate(date.minusDays(1))
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
        return DayClosingResponse.builder()
                .date(date.minusDays(1))
                .openingBalance(closing.getOpeningBalance())
                .totalCollection(closing.getTotalCollection())
                .totalAadhaiyam(closing.getTotalAadhaiyam())
                .totalAdapu(closing.getTotalAdapu())
                .totalExpenses(closing.getTotalExpenses())
                .additionalInvestment(closing.getAdditionalInvestment())
                .closingBalance(closing.getClosingBalance())
                .closed(true)
                .build();
    }

    /** Today's live collection total - used by the daily summary screen, refreshes after every collection. */
    public BigDecimal getTodayCollectionTotal() {
        return collectionEntryRepository.sumAmountByDate(LocalDate.now());
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

    private static class Totals {
        BigDecimal openingBalance;
        BigDecimal totalCollection;
        BigDecimal totalAadhaiyam;
        BigDecimal totalAdapu;
        BigDecimal totalExpenses;
        BigDecimal additionalInvestment;
        BigDecimal closingBalance;
    }
}
