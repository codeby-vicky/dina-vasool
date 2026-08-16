package com.vignesh.vasool.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Dynamic, admin-defined categories (e.g. "10000 phase", "5000 phase").
 * deductionRatePer1000 and repayRatePer1000 drive the aadhaiyam/total-payable
 * calculation and can be overridden per loan phase if needed.
 */
@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    // e.g. 50 -> 50 deducted per 1000 given (aadhaiyam rate)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal deductionRatePer1000;

    // e.g. 1200 -> customer repays 1200 per 1000 given (total payable rate)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal repayRatePer1000;

    // e.g. 60 -> standard repayment window in days before it's "overdue" (no extra interest after)
    @Column(nullable = false)
    private Integer standardDays;

    // Optional - when set, selecting this category auto-fills the Adapu (principal) field
    // with this amount so the collector doesn't have to type it manually every time.
    @Column(precision = 12, scale = 2)
    private BigDecimal defaultAmount;

    @Column(nullable = false)
    private boolean active;
}