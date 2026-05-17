package com.ufg.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data

public class UserDtos {
    private Long id;
    private Long credentialId;

    @NotBlank(message = "El nombre no puede estar vacio")
    private String name;

    @NotBlank(message = "El nombre de usuario no puede estar vacio")
    private String username;

    @PositiveOrZero(message = "Los seguidores no pueden ser negativos")
    private Integer followers = 0;

    @PositiveOrZero(message = "Los seguidos no pueden ser negativos")
    private Integer followed = 0;

    private String profilePhoto;


    private LocalDateTime creationDate;
}
