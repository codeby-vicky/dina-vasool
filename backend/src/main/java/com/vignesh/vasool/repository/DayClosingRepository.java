package com.vignesh.vasool.repository;

import com.vignesh.vasool.entity.DayClosing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DayClosingRepository extends JpaRepository<DayClosing, Long> {
    Optional<DayClosing> findByClosingDateAndOrganizationOwnerId(LocalDate date, Long organizationOwnerId);
    Optional<DayClosing> findTopByClosingDateBeforeAndOrganizationOwnerIdOrderByClosingDateDesc(LocalDate date, Long organizationOwnerId);
}
