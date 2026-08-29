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
 *
 * Uniqueness is (name, organizationOwnerId) - NOT name alone. Two different
 * organizations are allowed to both have a category named "1000"; only
 * duplicates within the SAME organization are blocked. Enforced here via the
 * composite unique constraint below, matching the actual DB constraint
 * categories_name_org_unique - do not add unique=true back onto name alone,
 * that recreates the old single-column bug.
 */
@Entity
@Table(
    name = "categories",
    uniqueConstraints = @UniqueConstraint(
        name = "categories_name_org_unique",
        columnNames = {"name", "organization_owner_id"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal deductionRatePer1000;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal repayRatePer1000;

    @Column(nullable = false)
    private Integer standardDays;

    @Column(precision = 12, scale = 2)
    private BigDecimal defaultAmount;

    @Column(nullable = false)
    private boolean active;

    private Long organizationOwnerId;
}
