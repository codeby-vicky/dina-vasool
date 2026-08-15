package com.vignesh.vasool.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LoanPhaseRequest {
    private Long customerId;
    private Long categoryId;
    private BigDecimal adapu; // principal to disburse

    // Optional manual overrides - if provided, autoCalculated is set to false
    private BigDecimal aadhaiyamOverride;
    private BigDecimal totalPayableOverride;

    private LocalDate startDate; // defaults to today if null
}
