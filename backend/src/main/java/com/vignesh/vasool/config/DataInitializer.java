package com.vignesh.vasool.config;

import com.vignesh.vasool.entity.User;
import com.vignesh.vasool.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Bootstraps a default admin account on first run only, since the
 * /api/admin/users endpoint that creates staff logins is itself
 * locked to ROLE_ADMIN - something has to create the first one.
 *
 * IMPORTANT: change this password immediately after first login,
 * then consider deleting/disabling this class or gating it behind
 * a property so it doesn't run in production every startup.
 */
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
            userRepository.save(admin);
            System.out.println("Default admin created -> username: admin / password: ChangeMe123! (CHANGE THIS)");
        }
    }
}
