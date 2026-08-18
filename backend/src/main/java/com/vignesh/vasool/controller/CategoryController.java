package com.vignesh.vasool.controller;

import com.vignesh.vasool.entity.Category;
import com.vignesh.vasool.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @PostMapping
    public Category create(@RequestBody Category category) {
        category.setActive(true);
        return categoryRepository.save(category);
    }

    @GetMapping
    public List<Category> getActive() {
        return categoryRepository.findByActiveTrue();
    }

    @PutMapping("/{id}")
    public Category update(@PathVariable Long id, @RequestBody Category updated) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        existing.setName(updated.getName());
        existing.setDeductionRatePer1000(updated.getDeductionRatePer1000());
        existing.setRepayRatePer1000(updated.getRepayRatePer1000());
        existing.setStandardDays(updated.getStandardDays());
        existing.setDefaultAmount(updated.getDefaultAmount());
        return categoryRepository.save(existing);
    }

    /** Soft-delete: existing loan phases still reference this category, so we deactivate
     *  rather than hard-delete, and it stops appearing in the active list for new loans. */
    @DeleteMapping("/{id}")
    public void deactivate(@PathVariable Long id) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        existing.setActive(false);
        categoryRepository.save(existing);
    }
}