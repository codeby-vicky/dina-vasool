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
    List<LoanPhase> findByStartDateAndOrganizationOwnerId(LocalDate date, Long organizationOwnerId);
    List<LoanPhase> findByCustomerId(Long customerId);
    int countByCustomerIdAndCategoryId(Long customerId, Long categoryId);
    List<LoanPhase> findByStatusAndOrganizationOwnerId(LoanPhase.PhaseStatus status, Long organizationOwnerId);

    @Query("select p from LoanPhase p join fetch p.customer where p.status in :statuses and p.organizationOwnerId = :orgId")
    List<LoanPhase> findByStatusInWithCustomer(@Param("statuses") List<LoanPhase.PhaseStatus> statuses, @Param("orgId") Long organizationOwnerId);

    @Query("select p from LoanPhase p join fetch p.category where p.customer.id = :customerId and p.status in :statuses")
    List<LoanPhase> findByCustomerIdAndStatusInWithCategory(@Param("customerId") Long customerId, @Param("statuses") List<LoanPhase.PhaseStatus> statuses);

    @Modifying
    @Query("delete from LoanPhase p where p.customer.id = :customerId")
    void deleteByCustomerId(@Param("customerId") Long customerId);
}
