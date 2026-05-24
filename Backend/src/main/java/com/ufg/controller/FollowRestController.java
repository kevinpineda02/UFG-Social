package com.ufg.controller;

import com.ufg.domain.FollowDtos;
import com.ufg.domain.FollowRequestDtos;
import com.ufg.domain.FollowStatusDtos;
import com.ufg.service.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/follow")
public class FollowRestController {

    private final FollowService followService;

    public FollowRestController(FollowService followService) {
        this.followService = followService;
    }

    @PostMapping("/request/{requesterId}/{receiverId}")
    public ResponseEntity<FollowRequestDtos> sendRequest(
            @PathVariable Long requesterId,
            @PathVariable Long receiverId) {

        FollowRequestDtos request = followService.sendRequest(requesterId, receiverId);

        return ResponseEntity.ok(request);
    }

    @DeleteMapping("/request/{requesterId}/{receiverId}")
    public ResponseEntity<String> cancelRequest(
            @PathVariable Long requesterId,
            @PathVariable Long receiverId) {

        followService.cancelRequest(requesterId, receiverId);

        return ResponseEntity.ok("Solicitud cancelada correctamente");
    }

    @PostMapping("/request/{requestId}/accept")
    public ResponseEntity<FollowRequestDtos> acceptRequest(
            @PathVariable Long requestId) {

        FollowRequestDtos request = followService.acceptRequest(requestId);

        return ResponseEntity.ok(request);
    }

    @PostMapping("/request/{requestId}/reject")
    public ResponseEntity<FollowRequestDtos> rejectRequest(
            @PathVariable Long requestId) {

        FollowRequestDtos request = followService.rejectRequest(requestId);

        return ResponseEntity.ok(request);
    }

    @GetMapping("/requests/pending/{userId}")
    public ResponseEntity<List<FollowRequestDtos>> getPendingRequests(
            @PathVariable Long userId) {

        List<FollowRequestDtos> requests = followService.getPendingRequests(userId);

        return ResponseEntity.ok(requests);
    }

    @GetMapping("/requests/sent/{userId}")
    public ResponseEntity<List<FollowRequestDtos>> getSentRequests(
            @PathVariable Long userId) {

        List<FollowRequestDtos> requests = followService.getSentRequests(userId);

        return ResponseEntity.ok(requests);
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<List<FollowDtos>> getFollowers(
            @PathVariable Long userId) {

        List<FollowDtos> followers = followService.getFollowers(userId);

        return ResponseEntity.ok(followers);
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<List<FollowDtos>> getFollowing(
            @PathVariable Long userId) {

        List<FollowDtos> following = followService.getFollowing(userId);

        return ResponseEntity.ok(following);
    }

    @GetMapping("/followers/{userId}/count")
    public ResponseEntity<Long> countFollowers(
            @PathVariable Long userId) {

        Long count = followService.countFollowers(userId);

        return ResponseEntity.ok(count);
    }

    @GetMapping("/following/{userId}/count")
    public ResponseEntity<Long> countFollowing(
            @PathVariable Long userId) {

        Long count = followService.countFollowing(userId);

        return ResponseEntity.ok(count);
    }

    @DeleteMapping("/{followerId}/{followedId}")
    public ResponseEntity<String> unfollow(
            @PathVariable Long followerId,
            @PathVariable Long followedId) {

        followService.unfollow(followerId, followedId);

        return ResponseEntity.ok("Relación de seguimiento eliminada correctamente");
    }

    @GetMapping("/status/{requesterId}/{targetUserId}")
    public ResponseEntity<FollowStatusDtos> getFollowStatus(
            @PathVariable Long requesterId,
            @PathVariable Long targetUserId) {

        FollowStatusDtos status = followService.getFollowStatus(requesterId, targetUserId);

        return ResponseEntity.ok(status);
    }
}