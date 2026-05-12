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
public class RegisterRequest {

    @NotBlank(message = "Debe de ser un corrreo")
    @Email
    private String correo;
    @NotBlank(message = "La contraseña no debe de ser nula")
    private String contrasena;
}
