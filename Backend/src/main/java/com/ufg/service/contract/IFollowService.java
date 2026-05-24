package com.ufg.service.contract;

import com.ufg.domain.FollowDtos;
import com.ufg.domain.FollowRequestDtos;
import com.ufg.domain.FollowStatusDtos;

import java.util.List;

public interface IFollowService {

    FollowRequestDtos sendRequest(Long requesterId, Long receiverId);

    void cancelRequest(Long requesterId, Long receiverId);

    FollowRequestDtos acceptRequest(Long requestId);

    FollowRequestDtos rejectRequest(Long requestId);

    List<FollowRequestDtos> getPendingRequests(Long receiverId);

    List<FollowRequestDtos> getSentRequests(Long requesterId);

    List<FollowDtos> getFollowers(Long userId);

    List<FollowDtos> getFollowing(Long userId);

    void unfollow(Long followerId, Long followedId);

    Long countFollowers(Long userId);

    Long countFollowing(Long userId);

    FollowStatusDtos getFollowStatus(Long requesterId, Long targetUserId);
}