package com.ufg.service.contract;

public interface IChatPermissionService {

    boolean canChat(Long senderId, Long receiverId);
}