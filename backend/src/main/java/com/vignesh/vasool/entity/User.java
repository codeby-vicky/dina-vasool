package com.vignesh.vasool.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Staff / collector who logs into the app. 2-3 users expected,
 * each doing their own daily collections independently.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password; // BCrypt hashed

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // ADMIN or COLLECTOR

    @Column(nullable = false)
    private boolean active;

    // The admin user id that owns this data's organization/business.
    // For an admin, this equals their own id (self). For a collector, it's
    // set to whichever admin created them - ties them to the same business.
    private Long organizationOwnerId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (!isActive()) active = true;
    }

    public enum Role {
        ADMIN, COLLECTOR
    }
}
