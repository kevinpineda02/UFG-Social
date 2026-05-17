package com.ufg.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicationImageDtos {

    @Positive(message = "El id debe ser positivo")
    private Long id;

    @Positive(message = "El id de la publicación debe ser positivo")
    private Long publicationId;

    @NotBlank(message = "La imagen no puede ir vacía")
    private String imageUrl;

    @PositiveOrZero(message = "El orden no puede ser negativo")
    private Integer orderImage;
}