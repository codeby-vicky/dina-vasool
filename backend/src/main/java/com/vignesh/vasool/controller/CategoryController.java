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
}
