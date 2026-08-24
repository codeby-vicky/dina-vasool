package com.vignesh.vasool.repository;

import com.vignesh.vasool.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findByOrganizationOwnerId(Long organizationOwnerId);
}
