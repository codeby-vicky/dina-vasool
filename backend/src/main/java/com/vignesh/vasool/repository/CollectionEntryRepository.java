package com.vignesh.vasool.repository;

import com.vignesh.vasool.entity.CollectionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface CollectionEntryRepository extends JpaRepository<CollectionEntry, Long> {

    List<CollectionEntry> findByCollectedDate(LocalDate date);

    List<CollectionEntry> findByCollectedDateBetween(LocalDate start, LocalDate end);

    List<CollectionEntry> findByLoanPhaseId(Long loanPhaseId);

    List<CollectionEntry> findByLoanPhaseIdOrderByCollectedDateDesc(Long loanPhaseId);

    @Modifying
    @Query("delete from CollectionEntry c where c.loanPhase.id = :loanPhaseId")
    void deleteByLoanPhaseId(@Param("loanPhaseId") Long loanPhaseId);

    @Modifying
    @Query("delete from CollectionEntry c where c.loanPhase.customer.id = :customerId")
    void deleteByCustomerId(@Param("customerId") Long customerId);

    @Query("select coalesce(sum(c.amount), 0) from CollectionEntry c where c.collectedDate = :date")
    BigDecimal sumAmountByDate(@Param("date") LocalDate date);

    @Query("select coalesce(sum(c.amount), 0) from CollectionEntry c where c.loanPhase.id = :loanPhaseId")
    BigDecimal sumAmountByLoanPhase(@Param("loanPhaseId") Long loanPhaseId);

    @Query("select coalesce(sum(c.amount), 0) from CollectionEntry c where c.collectedDate = :date and c.collectedBy.id = :userId")
    BigDecimal sumAmountByDateAndCollector(@Param("date") LocalDate date, @Param("userId") Long userId);
}