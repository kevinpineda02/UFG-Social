package com.ufg.data.repository;

import com.ufg.data.entity.PublicationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublicationRepository extends JpaRepository<PublicationEntity, Long> {

    List<PublicationEntity> findByUserId(Long idUser);

}
