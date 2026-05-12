package com.ufg.domain;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Correo incorrecto")
    @Email
    private String correo;
    @NotBlank(message = "La contraseña es incorrecta")
    private String contrasena;
}
