package com.furkankozmac.takttwin.infrastructure.web.dto;

import com.furkankozmac.takttwin.core.domain.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "E-mail can't be empty!")
    @Email(message = "Invalid e-mail format!")
    private String email;

    @NotBlank(message = "Password can't be empty!")
    @Size(min = 6, message = "Password must contain at least 6 characters!")
    private String password;

    @NotNull(message = "User role can't be empty!")
    private Role role;
}