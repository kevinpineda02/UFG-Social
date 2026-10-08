package com.ufg.controller;

import com.ufg.dto.FollowDtos;
import com.ufg.dto.FollowRequestDtos;
import com.ufg.dto.FollowStatusDtos;
import com.ufg.service.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/follow")
public class FollowRestController {

    // Inyección de dependencias del servicio de seguimiento
    private final FollowService followService;

    // Constructor para inyectar la dependencia del servicio de seguimiento
    public FollowRestController(FollowService followService) {
        this.followService = followService;
    }

    // Endpoint para enviar una solicitud de seguimiento
    @PostMapping("/request/{requesterId}/{receiverId}")
    public ResponseEntity<FollowRequestDtos> sendRequest(
            @PathVariable Long requesterId,
            @PathVariable Long receiverId) {

        FollowRequestDtos request = followService.sendRequest(requesterId, receiverId);

        return ResponseEntity.ok(request);
    }

    // Endpoint para cancelar una solicitud de seguimiento
    @DeleteMapping("/request/{requesterId}/{receiverId}")
    public ResponseEntity<String> cancelRequest(
            @PathVariable Long requesterId,
            @PathVariable Long receiverId) {

        followService.cancelRequest(requesterId, receiverId);

        return ResponseEntity.ok("Solicitud cancelada correctamente");
    }

    // Endpoint para aceptar una solicitud de seguimiento
    @PostMapping("/request/{requestId}/accept")
    public ResponseEntity<FollowRequestDtos> acceptRequest(
            @PathVariable Long requestId) {

        FollowRequestDtos request = followService.acceptRequest(requestId);

        return ResponseEntity.ok(request);
    }

    // Endpoint para rechazar una solicitud de seguimiento
    @PostMapping("/request/{requestId}/reject")
    public ResponseEntity<FollowRequestDtos> rejectRequest(
            @PathVariable Long requestId) {

        FollowRequestDtos request = followService.rejectRequest(requestId);

        return ResponseEntity.ok(request);
    }

    // Endpoint para obtener las solicitudes de seguimiento pendientes de un usuario
    @GetMapping("/requests/pending/{userId}")
    public ResponseEntity<List<FollowRequestDtos>> getPendingRequests(
            @PathVariable Long userId) {

        List<FollowRequestDtos> requests = followService.getPendingRequests(userId);

        return ResponseEntity.ok(requests);
    }

    // Endpoint para obtener las solicitudes de seguimiento enviadas por un usuario
    @GetMapping("/requests/sent/{userId}")
    public ResponseEntity<List<FollowRequestDtos>> getSentRequests(
            @PathVariable Long userId) {

        List<FollowRequestDtos> requests = followService.getSentRequests(userId);

        return ResponseEntity.ok(requests);
    }

    // Endpoint para obtener los seguidores de un usuario
    @GetMapping("/followers/{userId}")
    public ResponseEntity<List<FollowDtos>> getFollowers(
            @PathVariable Long userId) {

        List<FollowDtos> followers = followService.getFollowers(userId);

        return ResponseEntity.ok(followers);
    }

    // Endpoint para obtener los usuarios que sigue un usuario
    @GetMapping("/following/{userId}")
    public ResponseEntity<List<FollowDtos>> getFollowing(
            @PathVariable Long userId) {

        List<FollowDtos> following = followService.getFollowing(userId);

        return ResponseEntity.ok(following);
    }

    // Endpoint para contar los seguidores de un usuario
    @GetMapping("/followers/{userId}/count")
    public ResponseEntity<Long> countFollowers(
            @PathVariable Long userId) {

        Long count = followService.countFollowers(userId);

        return ResponseEntity.ok(count);
    }

    // Endpoint para contar los usuarios que sigue un usuario
    @GetMapping("/following/{userId}/count")
    public ResponseEntity<Long> countFollowing(
            @PathVariable Long userId) {

        Long count = followService.countFollowing(userId);

        return ResponseEntity.ok(count);
    }

    // Endpoint para dejar de seguir a un usuario
    @DeleteMapping("/{followerId}/{followedId}")
    public ResponseEntity<String> unfollow(
            @PathVariable Long followerId,
            @PathVariable Long followedId) {

        followService.unfollow(followerId, followedId);

        return ResponseEntity.ok("Relación de seguimiento eliminada correctamente");
    }

    // Endpoint para obtener el estado de seguimiento entre dos usuarios
    @GetMapping("/status/{requesterId}/{targetUserId}")
    public ResponseEntity<FollowStatusDtos> getFollowStatus(
            @PathVariable Long requesterId,
            @PathVariable Long targetUserId) {

        FollowStatusDtos status = followService.getFollowStatus(requesterId, targetUserId);

        return ResponseEntity.ok(status);
    }
}