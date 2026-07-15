package com.furkankozmac.takttwin.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "E-mail can't be empty!")
    @Email(message = "Invalid e-mail format!")
    private String email;

    @NotBlank(message = "Password can't be empty!")
    private String password;
}