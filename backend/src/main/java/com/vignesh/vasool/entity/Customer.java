package com.vignesh.vasool.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // saved name, matched against phone contacts

    private String phone; // optional now - customer can be added with just a name

    private String address; // used as "area" for location-based search

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnoreProperties("customer")
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<LoanPhase> loanPhases;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}