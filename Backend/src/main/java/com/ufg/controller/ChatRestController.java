package com.ufg.controller;

import com.ufg.dto.UserDtos;
import com.ufg.service.ChatPermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatRestController {

    // Inyección de dependencias del servicio de permisos de chat
    private final ChatPermissionService chatPermissionService;

    // Constructor para inyectar la dependencia del servicio de permisos de chat
    public ChatRestController(ChatPermissionService chatPermissionService) {
        this.chatPermissionService = chatPermissionService;
    }

    // Endpoint to check if two users can chat
    @GetMapping("/can-chat/{senderId}/{receiverId}")
    public ResponseEntity<Boolean> canChat(
            @PathVariable Long senderId,
            @PathVariable Long receiverId) {

        boolean canChat = chatPermissionService.canChat(senderId, receiverId);

        return ResponseEntity.ok(canChat);
    }

    // Endpoint to get chat contacts for a user
    @GetMapping("/contacts/{userId}")
    public ResponseEntity<List<UserDtos>> getChatContacts(
            @PathVariable Long userId) {

        List<UserDtos> contacts = chatPermissionService.getChatContacts(userId);

        return ResponseEntity.ok(contacts);
    }
}