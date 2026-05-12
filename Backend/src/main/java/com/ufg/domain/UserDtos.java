package com.ufg.domain;

import jakarta.validation.constraints.NotBlank;
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

    private Integer followers = 0;
    private Integer followed = 0;
    private String profilePhoto;
    private LocalDateTime creationDate;
}
