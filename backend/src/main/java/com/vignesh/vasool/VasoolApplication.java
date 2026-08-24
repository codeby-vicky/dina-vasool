package com.vignesh.vasool;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VasoolApplication {
    public static void main(String[] args) {
        SpringApplication.run(VasoolApplication.class, args);
    }
}
