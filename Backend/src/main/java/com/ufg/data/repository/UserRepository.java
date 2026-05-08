package com.ufg.data.repository;

import com.ufg.data.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByCorreo(String correo);

    String correo(String correo);
}
