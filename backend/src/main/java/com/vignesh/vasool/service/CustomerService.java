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

    public Customer create(CustomerRequest request, Long orgId) {
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            List<Customer> existing = customerRepository.findByPhoneAndOrganizationOwnerId(request.getPhone(), orgId);
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
        }
        Customer customer = Customer.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .organizationOwnerId(orgId)
                .build();
        return customerRepository.save(customer);
    }

    public List<Customer> search(String query, Long orgId) {
        return customerRepository.search(orgId, query == null ? "" : query);
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + id));
    }

    public Customer update(Long id, CustomerRequest request) {
        Customer customer = getById(id);
        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        return customerRepository.save(customer);
    }

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
