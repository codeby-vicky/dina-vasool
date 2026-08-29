package com.vignesh.vasool.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CollectionRequest {
    private Long loanPhaseId;
    private BigDecimal amount;
    private LocalDate collectedDate; // defaults to today if null - pass a past date to correct that day's entry
    private String paymentMode; // "CASH" or "GPAY" - defaults to CASH if null
    private String notes;
}
