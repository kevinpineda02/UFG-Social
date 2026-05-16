package com.ufg.data.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "publicaciones")
public class PublicationEntity {

    @Column(name = "id")
    @Id
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UserEntity user;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String description;

    @Column(name = "imagen_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "me_gustas")
    private Integer likes = 0;

    @Column(name = "comentarios")
    private Integer coments = 0;

    @PrePersist
    public void prePersist() {
        if (this.coments == null) {
            this.coments = 0;
        }
        if(this.coments == null){
            this.coments = 0;
        }
    }
}
