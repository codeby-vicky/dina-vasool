package com.vignesh.vasool.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Stores the closing calculation for one calendar day:
 *   a = openingBalance (mun-irupu, previous day's closingBalance) + totalCollection + totalAadhaiyam
 *   b = a - totalAdapu
 *   c = b - totalExpenses   -> closingBalance (becomes tomorrow's opening mun-irupu)
 *
 * Once a day is closed it's locked (closed = true) so it's not recalculated in place;
 * corrections require an explicit reopen via the admin.
 */
@Entity
@Table(name = "day_closings", uniqueConstraints = @UniqueConstraint(columnNames = {"closingDate", "organizationOwnerId"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayClosing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate closingDate;

    @Column(nullable = false)
    private Long organizationOwnerId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal openingBalance; // mun-irupu carried from previous day

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCollection;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAadhaiyam;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAdapu;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalExpenses;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal additionalInvestment = BigDecimal.ZERO; // extra money you personally put in on a day mun-irupu falls short

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal closingBalance; // = next day's mun-irupu / investment

    @Column(nullable = false)
    private boolean closed;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
