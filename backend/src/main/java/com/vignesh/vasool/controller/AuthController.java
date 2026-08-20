package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.LoginRequest;
import com.vignesh.vasool.dto.LoginResponse;
import com.vignesh.vasool.dto.SignupRequest;
import com.vignesh.vasool.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/signup")
    public LoginResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }
}