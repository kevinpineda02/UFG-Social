package com.ufg.data.repository;

import com.ufg.data.entity.CredentialEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CredentialRepository extends JpaRepository<CredentialEntity, Long> {
    Optional<CredentialEntity> findByCorreo(String correo);

    String correo(String correo);
}
