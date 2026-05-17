package com.ufg.controller;

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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Indica que esta clase es un controlador REST.
@RestController
@RequestMapping("/publication")
public class PublicationRestController {

    // Servicio principal de publicaciones:
    // crear, listar, transformar DTOs, editar, eliminar, etc.
    @Autowired
    PublicationService publicationService;

    // Servicio encargado de la lógica de likes:
    // dar like, quitar like, verificar si un usuario dio like y contar likes.
    @Autowired
    PublicationLikeService publicationLikeService;

    // Servicio encargado de los comentarios:
    // crear, listar y eliminar comentarios de publicaciones.
    @Autowired
    PublicationCommentService publicationCommentService;

    // Servicio encargado de las imágenes:
    // agregar, listar y eliminar imágenes asociadas a una publicación.
    @Autowired
    PublicationImageService publicationImageService;

    // Obtiene todas las publicaciones.
    @GetMapping
    public ResponseEntity<List<PublicationDtos>> searchPublication() {

        List<PublicationDtos> publications = publicationService.searchPublication();

        return ResponseEntity.ok(publications);
    }

    // Verifica si un usuario específico ya dio like a una publicación.
    @GetMapping("/{publicationId}/like/{userId}")
    public ResponseEntity<Boolean> userLikedPublication(
            @PathVariable Long publicationId,
            @PathVariable Long userId) {

        boolean liked = publicationLikeService.userLikedPublication(publicationId, userId);

        return ResponseEntity.ok(liked);
    }

    // Lista todas las imágenes asociadas a una publicación.
    @GetMapping("/{publicationId}/images")
    public ResponseEntity<List<PublicationImageDtos>> searchImagesByPublication(
            @PathVariable Long publicationId) {

        List<PublicationImageDtos> images =
                publicationImageService.searchImagesByPublication(publicationId);

        return ResponseEntity.ok(images);
    }

    // Cuenta cuántos likes tiene una publicación.
    @GetMapping("/{publicationId}/likes/count")
    public ResponseEntity<Integer> countLikes(@PathVariable Long publicationId) {

        Integer likes = publicationLikeService.countLikes(publicationId);

        return ResponseEntity.ok(likes);
    }

    // Lista todos los comentarios de una publicación.
    @GetMapping("/{publicationId}/comments")
    public ResponseEntity<List<PublicationCommentDtos>> searchCommentsByPublication(
            @PathVariable Long publicationId) {

        List<PublicationCommentDtos> comments =
                publicationCommentService.searchCommentsByPublication(publicationId);

        return ResponseEntity.ok(comments);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PublicationDtos>> searchPublicationUser(
            @PathVariable Long userId) {

        List<PublicationDtos> publications = publicationService.searchPublicationUser(userId);

        return ResponseEntity.ok(publications);
    }

    // Crea una nueva publicación junto con sus imágenes.
    @PostMapping
    public ResponseEntity<PublicationDtos> createPublication(
            @Valid @RequestBody PublicationDtos dtos) {

        PublicationDtos publicationCreated = publicationService.createPublication(dtos);

        return ResponseEntity.status(HttpStatus.CREATED).body(publicationCreated);
    }

    // Crea un comentario en una publicación.
    @PostMapping("/{publicationId}/comments/{userId}")
    public ResponseEntity<PublicationCommentDtos> createComment(
            @PathVariable Long publicationId,
            @PathVariable Long userId,
            @Valid @RequestBody PublicationCommentDtos dto) {

        PublicationCommentDtos commentCreated =
                publicationCommentService.createComment(publicationId, userId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(commentCreated);
    }

    // Da like a una publicación.
    @PostMapping("/{publicationId}/like/{userId}")
    public ResponseEntity<PublicationDtos> likePublication(
            @PathVariable Long publicationId,
            @PathVariable Long userId) {

        PublicationDtos publication = publicationLikeService.likePublication(publicationId, userId);

        return ResponseEntity.ok(publication);
    }

    // Agrega una imagen a una publicación ya existente.
    // Este endpoint lo puedes mantener por si después quieres agregar imágenes extra.
    @PostMapping("/{publicationId}/images")
    public ResponseEntity<PublicationImageDtos> addImage(
            @PathVariable Long publicationId,
            @Valid @RequestBody PublicationImageDtos dto) {

        PublicationImageDtos imageCreated = publicationImageService.addImage(publicationId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(imageCreated);
    }

    // Quita el like de un usuario en una publicación.
    @DeleteMapping("/{publicationId}/like/{userId}")
    public ResponseEntity<PublicationDtos> unlikePublication(
            @PathVariable Long publicationId,
            @PathVariable Long userId) {

        PublicationDtos publication = publicationLikeService.unlikePublication(publicationId, userId);

        return ResponseEntity.ok(publication);
    }

    // Elimina un comentario.
    @DeleteMapping("/comments/{commentId}/user/{userId}")
    public ResponseEntity<PublicationCommentDtos> deleteComment(
            @PathVariable Long commentId,
            @PathVariable Long userId) {

        PublicationCommentDtos deletedComment =
                publicationCommentService.deleteComment(commentId, userId);

        return ResponseEntity.ok(deletedComment);
    }

    // Elimina una imagen de una publicación.
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<PublicationImageDtos> deleteImage(@PathVariable Long imageId) {

        PublicationImageDtos deletedImage = publicationImageService.deleteImage(imageId);

        return ResponseEntity.ok(deletedImage);
    }
}