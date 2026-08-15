package com.vignesh.vasool.service;

import com.vignesh.vasool.dto.LoginRequest;
import com.vignesh.vasool.dto.LoginResponse;
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
}
