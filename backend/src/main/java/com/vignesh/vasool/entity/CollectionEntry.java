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

/**
 * A single day's payment from a customer against their active loan phase.
 * Amount is fully dynamic (customer may pay any amount on any day).
 * Named CollectionEntry (not Collection) to avoid clashing with java.util.Collection.
 */
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by", nullable = false)
    private User collectedBy;

    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}