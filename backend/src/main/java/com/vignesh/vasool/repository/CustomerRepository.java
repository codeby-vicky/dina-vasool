package com.vignesh.vasool.repository;

import com.vignesh.vasool.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("select c from Customer c where c.organizationOwnerId = :orgId and " +
           "(lower(c.name) like lower(concat('%', :q, '%')) or c.phone like concat('%', :q, '%') " +
           "or lower(c.address) like lower(concat('%', :q, '%')))")
    List<Customer> search(@Param("orgId") Long organizationOwnerId, @Param("q") String query);

    List<Customer> findByOrganizationOwnerId(Long organizationOwnerId);

    List<Customer> findByPhoneAndOrganizationOwnerId(String phone, Long organizationOwnerId);
}
