package com.ufg.data.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DialectOverride;

import java.math.BigInteger;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor

@Entity
@Table(name = "usuarios")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @OneToOne
    @JoinColumn(name = "id_credenciales", nullable = false)
    private CredentialEntity credential;

    @Column(name = "nombre")
    private String name;

    @Column(name = "nombre_usuario")
    private String username;

    @Column(name = "seguidores", nullable = false)
    private Integer followers = 0;

    @Column(name = "seguidos", nullable = false)
    private Integer followed = 0;

    @Column(name = "foto_perfil")
    private String profilePhoto;

    @CreationTimestamp()
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime creationDate;

}


