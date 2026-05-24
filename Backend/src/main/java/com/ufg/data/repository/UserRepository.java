package com.ufg.data.repository;

import com.ufg.data.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long>{
    Optional<UserEntity> findByCredential_Id(Long credentialId);

    @Query("""
    SELECT u
    FROM UserEntity u
    WHERE u.id <> :userId
    AND u.id NOT IN (
        SELECT f.followed.id
        FROM FollowEntity f
        WHERE f.follower.id = :userId
    )
    AND u.id NOT IN (
        SELECT r.receiver.id
        FROM FollowRequestEntity r
        WHERE r.requester.id = :userId
        AND r.status = com.ufg.data.enums.FollowRequestStatus.PENDIENTE
    )
""")
    List<UserEntity> findSuggestions(@Param("userId") Long userId);
}
