package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.CustomerRequest;
import com.vignesh.vasool.entity.Customer;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    public Customer create(@Valid @RequestBody CustomerRequest request, @AuthenticationPrincipal User currentUser) {
        return customerService.create(request, currentUser.getOrganizationOwnerId());
    }

    @GetMapping
    public List<Customer> search(@RequestParam(required = false) String q, @AuthenticationPrincipal User currentUser) {
        return customerService.search(q, currentUser.getOrganizationOwnerId());
    }

    @GetMapping("/{id}")
    public Customer getById(@PathVariable Long id) {
        return customerService.getById(id);
    }

    @PutMapping("/{id}")
    public Customer update(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return customerService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        customerService.delete(id);
    }
}
