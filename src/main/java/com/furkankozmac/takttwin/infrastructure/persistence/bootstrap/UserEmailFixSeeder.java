package com.furkankozmac.takttwin.infrastructure.persistence.bootstrap;

import com.furkankozmac.takttwin.core.domain.model.Role;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.UserEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.UserJpaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(3) // Run after DatabaseSeeder
public class UserEmailFixSeeder implements CommandLineRunner {

    private final UserJpaRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserEmailFixSeeder(UserJpaRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Migrate admin@tmmt.com to admin@example.com
        userRepository.findByEmail("admin@tmmt.com").ifPresent(admin -> {
            admin.setEmail("admin@example.com");
            userRepository.save(admin);
            System.out.println("[SEEDER] Migrated admin@tmmt.com to admin@example.com");
        });

        // Migrate operator1@tmmt.com to operator1@example.com
        userRepository.findByEmail("operator1@tmmt.com").ifPresent(operator -> {
            operator.setEmail("operator1@example.com");
            userRepository.save(operator);
            System.out.println("[SEEDER] Migrated operator1@tmmt.com to operator1@example.com");
        });

        // Create if missing
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            UserEntity admin = UserEntity.builder()
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("mysecurepassword123"))
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("[SEEDER] Created default admin@example.com");
        }

        if (userRepository.findByEmail("operator1@example.com").isEmpty()) {
            UserEntity operator = UserEntity.builder()
                    .email("operator1@example.com")
                    .password(passwordEncoder.encode("mysecurepassword123"))
                    .role(Role.ROLE_OPERATOR)
                    .build();
            userRepository.save(operator);
            System.out.println("[SEEDER] Created default operator1@example.com");
        }
    }
}
