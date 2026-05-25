package com.ufg.service;

import com.ufg.data.repository.FollowRepository;
import com.ufg.service.contract.IChatPermissionService;
import org.springframework.stereotype.Service;

@Service
public class ChatPermissionService implements IChatPermissionService {

    private final FollowRepository followRepository;

    public ChatPermissionService(FollowRepository followRepository) {
        this.followRepository = followRepository;
    }

    @Override
    public boolean canChat(Long senderId, Long receiverId) {

        if (senderId == null || receiverId == null) {
            return false;
        }

        if (senderId.equals(receiverId)) {
            return false;
        }

        boolean senderFollowsReceiver =
                followRepository.existsByFollowerIdAndFollowedId(senderId, receiverId);

        boolean receiverFollowsSender =
                followRepository.existsByFollowerIdAndFollowedId(receiverId, senderId);

        return senderFollowsReceiver && receiverFollowsSender;
    }
}