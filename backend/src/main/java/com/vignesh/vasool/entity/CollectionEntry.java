package com.vignesh.vasool.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "collection_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"customer", "category", "disbursedBy"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_phase_id", nullable = false)
    private LoanPhase loanPhase;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate collectedDate;

    // "CASH" or "GPAY". columnDefinition includes a SQL-level default so that
    // BOTH a fresh database create AND an ALTER on an existing populated table
    // can satisfy NOT NULL without a separate backfill step.
    @Column(nullable = false, columnDefinition = "varchar(10) default 'CASH'")
    @Builder.Default
    private String paymentMode = "CASH";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by", nullable = false)
    private User collectedBy;

    private String notes;

    private Long organizationOwnerId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}