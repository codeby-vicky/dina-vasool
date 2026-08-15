package com.vignesh.vasool.service;

import com.vignesh.vasool.dto.ExpenseRequest;
import com.vignesh.vasool.entity.Expense;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public Expense record(ExpenseRequest request, User recordedBy) {
        Expense expense = Expense.builder()
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .amount(request.getAmount())
                .description(request.getDescription())
                .recordedBy(recordedBy)
                .build();
        return expenseRepository.save(expense);
    }

    public List<Expense> getByDate(LocalDate date) {
        return expenseRepository.findByExpenseDate(date);
    }

    public BigDecimal getTotalForDate(LocalDate date) {
        return expenseRepository.sumAmountByDate(date);
    }
}
