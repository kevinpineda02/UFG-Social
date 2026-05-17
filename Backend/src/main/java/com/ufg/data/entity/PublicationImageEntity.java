package com.ufg.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "publicacion_imagenes")
public class PublicationImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_publicacion", nullable = false)
    private PublicationEntity publication;

    @Lob
    @Column(name = "imagen_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(name = "orden")
    private Integer orderImage = 0;
}