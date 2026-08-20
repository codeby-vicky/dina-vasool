package com.vignesh.vasool.service;

import com.vignesh.vasool.dto.LoginRequest;
import com.vignesh.vasool.dto.LoginResponse;
import com.vignesh.vasool.dto.SignupRequest;
import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.UserRepository;
import com.vignesh.vasool.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!user.isActive()) {
            throw new IllegalStateException("This account has been deactivated");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole().name());
        return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().name(), user.getId());
    }

    /**
     * Self-service signup for a brand new admin account - e.g. someone starting
     * a fresh, separate daily-collection business on their own copy of this app.
     * Always creates an ADMIN (not COLLECTOR), since only an admin can then use
     * POST /api/admin/users to create collector logins for their own team.
     * Auto-logs them in immediately after creating the account.
     */
    public LoginResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + request.getUsername());
        }
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone() != null ? request.getPhone() : "")
                .role(User.Role.ADMIN)
                .active(true)
                .build();
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole().name());
        return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().name(), user.getId());
    }
}