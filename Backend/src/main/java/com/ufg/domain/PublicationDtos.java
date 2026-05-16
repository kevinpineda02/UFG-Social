package com.ufg.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

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

    @URL(message = "La URL de la imagen no es valida")
    private String imageUrl;

    @URL(message = "La URL del video no es valida")
    private String videoUrl;

    @PositiveOrZero(message = "Los likes no pueden ser negativos")
    private Integer likes;

    @PositiveOrZero(message = "El contador de comentarios no pueden ser negativos")
    private Integer coments;

    //Datos del usuarioDTOs que se comparten
    @NotBlank(message = "El nombre no puede ir vacio")
    private String user;

    @NotBlank(message = "El nombre del usuario no puede ir vacio")
    private String username;

    @URL(message = "La URL de la foto de perfil no es valida")
    private String profilePhoto;

}
