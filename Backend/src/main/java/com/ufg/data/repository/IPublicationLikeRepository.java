package com.ufg.data.repository;

import com.ufg.data.entity.PublicationLikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IPublicationLikeRepository extends JpaRepository<PublicationLikeEntity, Long> {

    boolean existsByPublicationIdAndUserId(Long publicationId, Long userId);

    void deleteByPublicationIdAndUserId(Long publicationId, Long userId);

    Integer countByPublicationId(Long publicationId);
}