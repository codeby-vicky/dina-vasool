package com.vignesh.vasool.controller;

import com.vignesh.vasool.entity.Category;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @PostMapping
    public Category create(@RequestBody Category category, @AuthenticationPrincipal User currentUser) {
        category.setActive(true);
        category.setOrganizationOwnerId(currentUser.getOrganizationOwnerId());
        return categoryRepository.save(category);
    }

    @GetMapping
    public List<Category> getActive(@AuthenticationPrincipal User currentUser) {
        return categoryRepository.findByActiveTrueAndOrganizationOwnerId(currentUser.getOrganizationOwnerId());
    }

    @PutMapping("/{id}")
    public Category update(@PathVariable Long id, @RequestBody Category updated, @AuthenticationPrincipal User currentUser) {
        Category existing = categoryRepository.findByIdAndOrganizationOwnerId(id, currentUser.getOrganizationOwnerId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        existing.setName(updated.getName());
        existing.setDeductionRatePer1000(updated.getDeductionRatePer1000());
        existing.setRepayRatePer1000(updated.getRepayRatePer1000());
        existing.setStandardDays(updated.getStandardDays());
        existing.setDefaultAmount(updated.getDefaultAmount());
        return categoryRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void deactivate(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        Category existing = categoryRepository.findByIdAndOrganizationOwnerId(id, currentUser.getOrganizationOwnerId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        existing.setActive(false);
        categoryRepository.save(existing);
    }
}
