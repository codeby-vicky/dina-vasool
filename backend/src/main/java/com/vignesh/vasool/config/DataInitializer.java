package com.vignesh.vasool.config;

import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("ChangeMe123!"))
                    .fullName("Admin")
                    .phone("0000000000")
                    .role(User.Role.ADMIN)
                    .active(true)
                    .build();
            admin = userRepository.save(admin);
            admin.setOrganizationOwnerId(admin.getId());
            userRepository.save(admin);
            System.out.println("Default admin created -> username: admin / password: ChangeMe123! (CHANGE THIS)");
        }
    }
}
