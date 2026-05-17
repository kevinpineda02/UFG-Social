package com.ufg.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicationCommentDtos {

    @Positive(message = "El id debe ser positivo")
    private Long id;

    @Positive(message = "El id de la publicación debe ser positivo")
    private Long publicationId;

    @Positive(message = "El id del usuario debe ser positivo")
    private Long userId;

    @NotBlank(message = "El comentario no puede ir vacío")
    private String comment;

    private String user;
    private String username;
    private String profilePhoto;

    private LocalDateTime creationDate;
}