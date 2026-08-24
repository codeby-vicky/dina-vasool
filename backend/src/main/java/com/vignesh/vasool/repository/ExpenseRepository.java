package com.vignesh.vasool.repository;

import com.vignesh.vasool.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByExpenseDateAndOrganizationOwnerId(LocalDate date, Long organizationOwnerId);

    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.expenseDate = :date and e.organizationOwnerId = :orgId")
    BigDecimal sumAmountByDate(@Param("date") LocalDate date, @Param("orgId") Long organizationOwnerId);
}
