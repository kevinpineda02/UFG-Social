package com.ufg.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {

    //Validadores de correo y contraseña
    @NotBlank(message = "Debe de ser un corrreo")
    @Email(regexp ="^[A-Za-z0-9._%+-]+@ufg.edu\\\\.sv$", message = "Debe de ser un correo valido")
    private String correo;

    @NotBlank(message = "La contraseña no debe de ser nula")
    @Size(min = 8, message = "La contraseña debe de tener al menos 8 caracteres" )
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial")
    private String contrasena;
}


