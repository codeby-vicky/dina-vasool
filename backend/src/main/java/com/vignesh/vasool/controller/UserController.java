package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.CreateUserRequest;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin-only: create collector logins that belong to the SAME business/org as the creating admin. */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping
    public User create(@Valid @RequestBody CreateUserRequest request, @AuthenticationPrincipal User currentUser) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + request.getUsername());
        }
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole() != null ? User.Role.valueOf(request.getRole()) : User.Role.COLLECTOR)
                .active(true)
                .organizationOwnerId(currentUser.getOrganizationOwnerId())
                .build();
        return userRepository.save(user);
    }

    @GetMapping
    public List<User> getAll(@AuthenticationPrincipal User currentUser) {
        return userRepository.findByOrganizationOwnerId(currentUser.getOrganizationOwnerId());
    }
}
