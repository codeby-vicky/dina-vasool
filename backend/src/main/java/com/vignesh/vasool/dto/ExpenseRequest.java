package com.vignesh.vasool.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseRequest {
    private LocalDate expenseDate; // defaults to today if null
    private BigDecimal amount;
    private String description;
}
