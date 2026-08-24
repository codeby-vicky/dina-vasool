package com.vignesh.vasool.repository;

import com.vignesh.vasool.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrueAndOrganizationOwnerId(Long organizationOwnerId);
    Optional<Category> findByIdAndOrganizationOwnerId(Long id, Long organizationOwnerId);
}
