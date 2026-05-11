package com.ufg.data.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DialectOverride;

import java.math.BigInteger;
import java.time.LocalDateTime;

@Data
@Builder
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
    private CredentialEntity credenciales;

    @Column(name = "nombre")
    String name;

    @Column(name = "nombre_usuario")
    String username;

    @Column(name = "seguidores")
    Integer followers;

    @Column(name = "seguidos")
    Integer followed;

    @Column(name = "foto_perfil")
    String profilePhoto;

    @CreationTimestamp()
    @Column(name = "fecha_creacion", updatable = false)
    LocalDateTime creationDate;

}
