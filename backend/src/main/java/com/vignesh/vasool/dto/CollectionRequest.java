package com.vignesh.vasool.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CollectionRequest {
    private Long loanPhaseId;
    private BigDecimal amount;
    private LocalDate collectedDate; // defaults to today if null
    private String notes;
}
