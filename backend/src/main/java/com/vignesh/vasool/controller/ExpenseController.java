package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.ExpenseRequest;
import com.vignesh.vasool.entity.Expense;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public Expense record(@Valid @RequestBody ExpenseRequest request,
                           @AuthenticationPrincipal User currentUser) {
        return expenseService.record(request, currentUser);
    }

    @GetMapping
    public List<Expense> getByDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return expenseService.getByDate(date);
    }
}
