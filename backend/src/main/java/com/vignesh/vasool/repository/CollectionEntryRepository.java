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

    @Query("select c from CollectionEntry c join fetch c.loanPhase where c.collectedDate = :date and c.organizationOwnerId = :orgId")
    List<CollectionEntry> findByCollectedDateWithPhase(@Param("date") LocalDate date, @Param("orgId") Long organizationOwnerId);

    @Query("select c from CollectionEntry c join fetch c.loanPhase where c.collectedDate between :start and :end and c.organizationOwnerId = :orgId")
    List<CollectionEntry> findByCollectedDateBetweenWithPhase(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("orgId") Long organizationOwnerId);

    List<CollectionEntry> findByLoanPhaseId(Long loanPhaseId);

    java.util.Optional<CollectionEntry> findByLoanPhaseIdAndCollectedDate(Long loanPhaseId, LocalDate collectedDate);

    @Modifying
    @Query("delete from CollectionEntry c where c.loanPhase.id = :loanPhaseId")
    void deleteByLoanPhaseId(@Param("loanPhaseId") Long loanPhaseId);

    @Modifying
    @Query("delete from CollectionEntry c where c.loanPhase.customer.id = :customerId")
    void deleteByCustomerId(@Param("customerId") Long customerId);

    @Query("select coalesce(sum(c.amount), 0) from CollectionEntry c where c.collectedDate = :date and c.organizationOwnerId = :orgId")
    BigDecimal sumAmountByDate(@Param("date") LocalDate date, @Param("orgId") Long organizationOwnerId);

    @Query("select coalesce(sum(c.amount), 0) from CollectionEntry c where c.loanPhase.id = :loanPhaseId")
    BigDecimal sumAmountByLoanPhase(@Param("loanPhaseId") Long loanPhaseId);
}
