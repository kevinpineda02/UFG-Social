package com.ufg.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicationDtos {

    @Positive(message = "El id debe de ser positivo")
    private Long id;

    @Positive(message = "El id del usuario debe de ser positivo")
    private Long idUser;

    @NotBlank(message = "No puede ir vacio la descripcion")
    private String description;

    private String videoUrl;

    @PositiveOrZero(message = "Los likes no pueden ser negativos")
    private Integer likes;

    @PositiveOrZero(message = "El contador de comentarios no pueden ser negativos")
    private Integer coments;

    @NotBlank(message = "El nombre no puede ir vacio")
    private String user;

    @NotBlank(message = "El nombre del usuario no puede ir vacio")
    private String username;

    private String profilePhoto;

    private LocalDateTime creationDate;

    private List<PublicationImageDtos> images;
    private List<PublicationCommentDtos> commentsList;
    private Boolean likedByCurrentUser;
}