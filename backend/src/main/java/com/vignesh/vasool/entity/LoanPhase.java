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
 * One disbursement cycle ("phase") for a customer in a category.
 * adapu = principal given to customer.
 * aadhaiyam = upfront deduction (auto-calculated from category rate, overridable).
 * totalPayable = amount customer must repay in total (auto-calculated, overridable).
 * Balance is tracked by summing Collection entries against this phase.
 */
@Entity
@Table(name = "loan_phases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal adapu; // principal disbursed

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal aadhaiyam; // upfront deduction, auto-calc but overridable

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPayable; // auto-calc but overridable

    @Column(nullable = false)
    private boolean autoCalculated; // false if staff manually overrode the auto values

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private Integer standardDays; // copied from category at creation time, e.g. 60

    @Column(nullable = false)
    @Builder.Default
    private Integer phaseNumber = 1;

    @Column(nullable = false)
    private Long organizationOwnerId; // 1 = first loan for this customer+category, 2 = second time borrowing, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PhaseStatus status; // ACTIVE, OVERDUE, CLOSED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disbursed_by")
    private User disbursedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = PhaseStatus.ACTIVE;
    }

    public enum PhaseStatus {
        ACTIVE, OVERDUE, CLOSED
    }
}
