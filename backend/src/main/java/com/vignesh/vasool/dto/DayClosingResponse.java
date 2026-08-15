package com.vignesh.vasool.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@Builder
public class DayClosingResponse {
    private LocalDate date;
    private BigDecimal openingBalance;   // mun-irupu carried in
    private BigDecimal totalCollection;
    private BigDecimal totalAadhaiyam;
    private BigDecimal totalAdapu;
    private BigDecimal totalExpenses;
    private BigDecimal additionalInvestment; // extra money manually added when mun-irupu falls short of today's adapu needs
    private BigDecimal closingBalance;   // mun-irupu for next day
    private boolean closed;
}
