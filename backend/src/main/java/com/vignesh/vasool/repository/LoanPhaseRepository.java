package com.vignesh.vasool.repository;

import com.vignesh.vasool.entity.LoanPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LoanPhaseRepository extends JpaRepository<LoanPhase, Long> {
    List<LoanPhase> findByCustomerIdAndStatusIn(Long customerId, List<LoanPhase.PhaseStatus> statuses);
    List<LoanPhase> findByStartDate(LocalDate date);
    List<LoanPhase> findByStatus(LoanPhase.PhaseStatus status);
    List<LoanPhase> findByStatusIn(List<LoanPhase.PhaseStatus> statuses);
    List<LoanPhase> findByCustomerId(Long customerId);
    int countByCustomerIdAndCategoryId(Long customerId, Long categoryId);

    @Modifying
    @Query("delete from LoanPhase p where p.customer.id = :customerId")
    void deleteByCustomerId(@Param("customerId") Long customerId);
}