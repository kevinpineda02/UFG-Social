package com.ufg.dto;

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
    @Email(regexp ="^[A-Za-z0-9._%+-]+@ufg.edu\\\\.sv", message = "El Correo debe de pertenecer a la ufg")
    private String correo;

    @NotBlank(message = "La contraseña es incorrecta")
    private String contrasena;
}

