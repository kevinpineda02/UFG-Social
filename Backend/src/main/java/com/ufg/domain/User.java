package com.ufg.domain;

import com.ufg.data.entity.CredentialEntity;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data

public class User {
    private Long id;
    private Integer credentialId;

    @NotBlank(message = "El nombre no puede estar vacio")
    private String name;
    @NotBlank(message = "El nombre de usuario no puede estar vacio")
    private String username;

    private Integer followers;
    private Integer followed;
    private String profilePhoto;
    private LocalDateTime creationDate;
}
