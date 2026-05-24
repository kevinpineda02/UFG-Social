package com.ufg.data.repository;

import com.ufg.data.entity.FollowEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<FollowEntity, Long> {

    List<FollowEntity> findByFollowerId(Long followerId);

    List<FollowEntity> findByFollowedId(Long followedId);

    boolean existsByFollowerIdAndFollowedId(Long followerId, Long followedId);

    Optional<FollowEntity> findByFollowerIdAndFollowedId(Long followerId, Long followedId);

    Long countByFollowerId(Long followerId);

    Long countByFollowedId(Long followedId);
}