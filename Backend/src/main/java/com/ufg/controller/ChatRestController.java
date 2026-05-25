package com.ufg.controller;

import com.ufg.service.ChatPermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
public class ChatRestController {

    private final ChatPermissionService chatPermissionService;

    public ChatRestController(ChatPermissionService chatPermissionService) {
        this.chatPermissionService = chatPermissionService;
    }

    @GetMapping("/can-chat/{senderId}/{receiverId}")
    public ResponseEntity<Boolean> canChat(
            @PathVariable Long senderId,
            @PathVariable Long receiverId) {

        boolean canChat = chatPermissionService.canChat(senderId, receiverId);

        return ResponseEntity.ok(canChat);
    }
}