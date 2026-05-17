package com.ufg.data.repository;

import com.ufg.data.entity.PublicationImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IPublicationImageRepository extends JpaRepository<PublicationImageEntity, Long> {

    List<PublicationImageEntity> findByPublicationId(Long publicationId);
}