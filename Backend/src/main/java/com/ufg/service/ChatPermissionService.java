package com.ufg.service;

import com.ufg.data.entity.FollowEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.FollowRepository;
import com.ufg.domain.UserDtos;
import com.ufg.service.contract.IChatPermissionService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

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

    @Override
    public List<UserDtos> getChatContacts(Long userId) {

        List<FollowEntity> following = followRepository.findByFollowerId(userId);

        List<UserDtos> contacts = new ArrayList<>();

        for (FollowEntity follow : following) {
            Long followedId = follow.getFollowed().getId();

            boolean mutualFollow = followRepository.existsByFollowerIdAndFollowedId(
                    followedId,
                    userId
            );

            if (mutualFollow) {
                UserEntity user = follow.getFollowed();

                UserDtos dto = new UserDtos();
                dto.setId(user.getId());
                dto.setName(user.getName());
                dto.setUsername(user.getUsername());
                dto.setProfilePhoto(user.getProfilePhoto());
                dto.setCreationDate(user.getCreationDate());

                if (user.getCredential() != null) {
                    dto.setCredentialId(user.getCredential().getId());
                }

                contacts.add(dto);
            }
        }

        return contacts;
    }
}