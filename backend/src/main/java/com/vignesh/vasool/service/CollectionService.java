package com.vignesh.vasool.service;

import com.vignesh.vasool.dto.CollectionRequest;
import com.vignesh.vasool.entity.CollectionEntry;
import com.vignesh.vasool.entity.LoanPhase;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.CollectionEntryRepository;
import com.vignesh.vasool.repository.LoanPhaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Records a day's payment against a customer's active loan phase.
 * Amount is fully dynamic - any value the customer actually hands over.
 * Auto-closes the phase once the running total collected meets/exceeds totalPayable.
 */
@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionEntryRepository collectionEntryRepository;
    private final LoanPhaseRepository loanPhaseRepository;

    /**
     * Records (or replaces) a day's payment. If an entry already exists for this
     * loan phase on this exact date, it's REPLACED with the new amount (not duplicated) -
     * covers correcting today's collection. A different date always creates a new entry.
     */
    public CollectionEntry record(CollectionRequest request, User collectedBy) {
        LoanPhase phase = loanPhaseRepository.findById(request.getLoanPhaseId())
                .orElseThrow(() -> new IllegalArgumentException("Loan phase not found: " + request.getLoanPhaseId()));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Collection amount must be greater than zero");
        }

        LocalDate date = request.getCollectedDate() != null ? request.getCollectedDate() : LocalDate.now();

        CollectionEntry entry = collectionEntryRepository
                .findByLoanPhaseIdAndCollectedDate(phase.getId(), date)
                .orElseGet(() -> CollectionEntry.builder()
                        .loanPhase(phase)
                        .collectedDate(date)
                        .build());

        entry.setAmount(request.getAmount());
        entry.setCollectedBy(collectedBy);
        entry.setNotes(request.getNotes());

        CollectionEntry saved = collectionEntryRepository.save(entry);

        // Auto-close the phase if fully repaid
        BigDecimal totalCollected = collectionEntryRepository.sumAmountByLoanPhase(phase.getId());
        if (totalCollected.compareTo(phase.getTotalPayable()) >= 0
                && phase.getStatus() != LoanPhase.PhaseStatus.CLOSED) {
            phase.setStatus(LoanPhase.PhaseStatus.CLOSED);
            loanPhaseRepository.save(phase);
        }

        return saved;
    }

    public BigDecimal getOutstandingBalance(LoanPhase phase) {
        BigDecimal collected = collectionEntryRepository.sumAmountByLoanPhase(phase.getId());
        return phase.getTotalPayable().subtract(collected);
    }

    public List<CollectionEntry> getByDate(LocalDate date) {
        return collectionEntryRepository.findByCollectedDateWithPhase(date);
    }

    public BigDecimal getTotalForDate(LocalDate date) {
        return collectionEntryRepository.sumAmountByDate(date);
    }

    public List<CollectionEntry> getHistoryForPhase(Long loanPhaseId) {
        return collectionEntryRepository.findByLoanPhaseId(loanPhaseId);
    }

    public List<CollectionEntry> getByRange(LocalDate start, LocalDate end) {
        return collectionEntryRepository.findByCollectedDateBetweenWithPhase(start, end);
    }
}