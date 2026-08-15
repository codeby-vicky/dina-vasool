package com.vignesh.vasool.controller;

import com.vignesh.vasool.dto.LoginRequest;
import com.vignesh.vasool.dto.LoginResponse;
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
}
