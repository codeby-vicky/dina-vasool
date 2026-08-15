package com.vignesh.vasool.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
    @NotBlank
    private String fullName;
    @NotBlank
    private String phone;
    private String role; // "ADMIN" or "COLLECTOR", defaults to COLLECTOR
}
