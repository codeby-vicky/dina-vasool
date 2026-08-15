package com.vignesh.vasool.repository;

import com.vignesh.vasool.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
    List<Customer> findByPhone(String phone);
    boolean existsByPhone(String phone);
}
