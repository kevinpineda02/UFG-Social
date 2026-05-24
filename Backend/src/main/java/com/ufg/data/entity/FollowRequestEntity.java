package com.ufg.data.entity;

import com.ufg.data.enums.FollowRequestStatus;
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
        name = "solicitudes_seguimiento",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_solicitud_unica",
                        columnNames = {"id_solicitante", "id_receptor"}
                )
        }
)
public class FollowRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Usuario que envía la solicitud
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitante", nullable = false)
    private UserEntity requester;

    // Usuario que recibe la solicitud
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_receptor", nullable = false)
    private UserEntity receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private FollowRequestStatus status = FollowRequestStatus.PENDIENTE;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime creationDate;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = FollowRequestStatus.PENDIENTE;
        }
    }
}