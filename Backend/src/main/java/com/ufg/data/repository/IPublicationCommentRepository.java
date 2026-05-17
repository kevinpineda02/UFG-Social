package com.ufg.data.repository;

import com.ufg.data.entity.PublicationCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IPublicationCommentRepository extends JpaRepository<PublicationCommentEntity, Long> {

    List<PublicationCommentEntity> findByPublicationId(Long publicationId);
}