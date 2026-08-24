package com.vignesh.vasool.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerRequest {
    @NotBlank
    private String name;
    private String phone; // optional
    private String address; // "area"
}
