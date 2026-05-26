package com.ufg.service.contract;

import com.ufg.domain.UserDtos;

import java.util.List;

public interface IChatPermissionService {

    boolean canChat(Long senderId, Long receiverId);

    List<UserDtos> getChatContacts(Long userId);
}