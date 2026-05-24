package com.ufg.data.repository;

import com.ufg.data.entity.FollowRequestEntity;
import com.ufg.data.enums.FollowRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRequestRepository extends JpaRepository<FollowRequestEntity, Long> {

    Optional<FollowRequestEntity> findByRequesterIdAndReceiverId(
            Long requesterId,
            Long receiverId
    );

    Optional<FollowRequestEntity> findByRequesterIdAndReceiverIdAndStatus(
            Long requesterId,
            Long receiverId,
            FollowRequestStatus status
    );

    List<FollowRequestEntity> findByReceiverIdAndStatus(
            Long receiverId,
            FollowRequestStatus status
    );

    List<FollowRequestEntity> findByRequesterIdAndStatus(
            Long requesterId,
            FollowRequestStatus status
    );
}