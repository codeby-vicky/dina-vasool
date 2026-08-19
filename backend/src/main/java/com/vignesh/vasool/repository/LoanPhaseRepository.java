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

    /** Same as findByStatusIn but forces the customer relationship to load eagerly -
     *  needed because customer is lazy-fetched by default and was silently coming
     *  back null in JSON responses, breaking the paid/unpaid status dots. */
    @Query("select p from LoanPhase p join fetch p.customer where p.status in :statuses")
    List<LoanPhase> findByStatusInWithCustomer(@Param("statuses") List<LoanPhase.PhaseStatus> statuses);

    @Modifying
    @Query("delete from LoanPhase p where p.customer.id = :customerId")
    void deleteByCustomerId(@Param("customerId") Long customerId);
}