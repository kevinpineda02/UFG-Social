package com.ufg.controller;

import com.ufg.data.entity.UserEntity;
import com.ufg.domain.PublicationCommentDtos;
import com.ufg.domain.PublicationDtos;
import com.ufg.domain.PublicationImageDtos;
import com.ufg.service.PublicationCommentService;
import com.ufg.service.PublicationImageService;
import com.ufg.service.PublicationLikeService;
import com.ufg.service.PublicationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/publication")
public class PublicationRestController {

    @Autowired
    PublicationService publicationService;

    @Autowired
    PublicationLikeService publicationLikeService;

    @Autowired
    PublicationCommentService publicationCommentService;

    @Autowired
    PublicationImageService publicationImageService;

    @GetMapping
    public ResponseEntity<List<PublicationDtos>> searchPublication() {
        List<PublicationDtos> publications = publicationService.searchPublication();
        return ResponseEntity.ok(publications);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PublicationDtos>> searchPublicationUser(
            @PathVariable Long userId) {

        List<PublicationDtos> publications = publicationService.searchPublicationUser(userId);
        return ResponseEntity.ok(publications);
    }

    @PostMapping(
            value = "/{userId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PublicationDtos> createPublication(
            @PathVariable Long userId,
            @RequestPart("description") String description,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestPart(value = "videoFile", required = false) MultipartFile videoFile
    ) {
        PublicationDtos publication = publicationService.createPublication(
                userId,
                description,
                files,
                videoFile
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(publication);
    }

    @GetMapping("/{publicationId}/like/{userId}")
    public ResponseEntity<Boolean> userLikedPublication(
            @PathVariable Long publicationId,
            @PathVariable Long userId) {

        boolean liked = publicationLikeService.userLikedPublication(publicationId, userId);

        return ResponseEntity.ok(liked);
    }

    @PostMapping("/{publicationId}/like/{userId}")
    public ResponseEntity<PublicationDtos> likePublication(
            @PathVariable Long publicationId,
            @PathVariable Long userId) {

        PublicationDtos publication = publicationLikeService.likePublication(publicationId, userId);

        return ResponseEntity.ok(publication);
    }

    @DeleteMapping("/{publicationId}/like/{userId}")
    public ResponseEntity<PublicationDtos> unlikePublication(
            @PathVariable Long publicationId,
            @PathVariable Long userId) {

        PublicationDtos publication = publicationLikeService.unlikePublication(publicationId, userId);

        return ResponseEntity.ok(publication);
    }

    @GetMapping("/{publicationId}/likes/count")
    public ResponseEntity<Integer> countLikes(@PathVariable Long publicationId) {
        Integer likes = publicationLikeService.countLikes(publicationId);
        return ResponseEntity.ok(likes);
    }

    @GetMapping("/{publicationId}/comments")
    public ResponseEntity<List<PublicationCommentDtos>> searchCommentsByPublication(
            @PathVariable Long publicationId) {

        List<PublicationCommentDtos> comments =
                publicationCommentService.searchCommentsByPublication(publicationId);

        return ResponseEntity.ok(comments);
    }

    @PostMapping("/{publicationId}/comments/{userId}")
    public ResponseEntity<PublicationCommentDtos> createComment(
            @PathVariable Long publicationId,
            @PathVariable Long userId,
            @Valid @RequestBody PublicationCommentDtos dto) {

        PublicationCommentDtos commentCreated =
                publicationCommentService.createComment(publicationId, userId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(commentCreated);
    }

    @DeleteMapping("/comments/{commentId}/user/{userId}")
    public ResponseEntity<PublicationCommentDtos> deleteComment(
            @PathVariable Long commentId,
            @PathVariable Long userId) {

        PublicationCommentDtos deletedComment =
                publicationCommentService.deleteComment(commentId, userId);

        return ResponseEntity.ok(deletedComment);
    }

    @GetMapping("/{publicationId}/images")
    public ResponseEntity<List<PublicationImageDtos>> searchImagesByPublication(
            @PathVariable Long publicationId) {

        List<PublicationImageDtos> images =
                publicationImageService.searchImagesByPublication(publicationId);

        return ResponseEntity.ok(images);
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<PublicationImageDtos> deleteImage(@PathVariable Long imageId) {
        PublicationImageDtos deletedImage = publicationImageService.deleteImage(imageId);
        return ResponseEntity.ok(deletedImage);
    }

    @DeleteMapping("/{publicationId}/user/{userId}")
    public ResponseEntity<PublicationDtos> deletePublication(
            @PathVariable Long publicationId,
            @PathVariable Long userId) {

        UserEntity userAuthenticate = new UserEntity();
        userAuthenticate.setId(userId);

        PublicationDtos deletedPublication =
                publicationService.deletePublication(publicationId, userAuthenticate);

        return ResponseEntity.ok(deletedPublication);
    }
}