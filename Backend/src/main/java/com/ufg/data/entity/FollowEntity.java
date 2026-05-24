package com.ufg.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "seguimientos",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_seguimiento_unico",
                        columnNames = {"id_seguidor", "id_seguido"}
                )
        }
)
public class FollowEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Usuario que sigue
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_seguidor", nullable = false)
    private UserEntity follower;

    // Usuario seguido
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_seguido", nullable = false)
    private UserEntity followed;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime creationDate;
}