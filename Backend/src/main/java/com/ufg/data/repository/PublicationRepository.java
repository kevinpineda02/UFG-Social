package com.ufg.data.repository;

import com.ufg.data.entity.PublicationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicationRepository extends JpaRepository<PublicationEntity, Long> {

}
