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

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionEntryRepository collectionEntryRepository;
    private final LoanPhaseRepository loanPhaseRepository;

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
                        .organizationOwnerId(collectedBy.getOrganizationOwnerId())
                        .build());

        entry.setAmount(request.getAmount());
        entry.setCollectedBy(collectedBy);
        entry.setNotes(request.getNotes());

        CollectionEntry saved = collectionEntryRepository.save(entry);

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

    public List<CollectionEntry> getByDate(LocalDate date, Long orgId) {
        return collectionEntryRepository.findByCollectedDateWithPhase(date, orgId);
    }

    public BigDecimal getTotalForDate(LocalDate date, Long orgId) {
        return collectionEntryRepository.sumAmountByDate(date, orgId);
    }

    public List<CollectionEntry> getHistoryForPhase(Long loanPhaseId) {
        return collectionEntryRepository.findByLoanPhaseId(loanPhaseId);
    }

    public List<CollectionEntry> getByRange(LocalDate start, LocalDate end, Long orgId) {
        return collectionEntryRepository.findByCollectedDateBetweenWithPhase(start, end, orgId);
    }
}
