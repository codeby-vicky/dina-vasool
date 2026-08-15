package com.vignesh.vasool.service;

import com.vignesh.vasool.dto.CustomerRequest;
import com.vignesh.vasool.entity.Customer;
import com.vignesh.vasool.repository.CollectionEntryRepository;
import com.vignesh.vasool.repository.CustomerRepository;
import com.vignesh.vasool.repository.LoanPhaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final LoanPhaseRepository loanPhaseRepository;
    private final CollectionEntryRepository collectionEntryRepository;

    public Customer create(CustomerRequest request) {
        // Prevent duplicates: if this phone number is already saved, return
        // the existing (first) customer instead of creating a new duplicate row.
        List<Customer> existing = customerRepository.findByPhone(request.getPhone());
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        Customer customer = Customer.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .build();
        return customerRepository.save(customer);
    }

    public List<Customer> search(String query) {
        if (query == null || query.isBlank()) {
            return customerRepository.findAll();
        }
        return customerRepository.findByNameContainingIgnoreCaseOrPhoneContaining(query, query);
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + id));
    }

    public List<Customer> getAll() {
        return customerRepository.findAll();
    }

    /**
     * Deletes a customer and everything tied to them (collection history,
     * loan phases). Used for the "accidentally added" cleanup case.
     */
    @Transactional
    public void delete(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new IllegalArgumentException("Customer not found: " + id);
        }
        collectionEntryRepository.deleteByCustomerId(id);
        loanPhaseRepository.deleteByCustomerId(id);
        customerRepository.deleteById(id);
    }
}