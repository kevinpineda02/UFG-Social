package com.ufg.service;

import com.ufg.data.entity.PublicationCommentEntity;
import com.ufg.data.entity.PublicationEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.IPublicationCommentRepository;
import com.ufg.data.repository.PublicationRepository;
import com.ufg.data.repository.UserRepository;
import com.ufg.domain.PublicationCommentDtos;
import com.ufg.service.contract.IPublicationCommentService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PublicationCommentService implements IPublicationCommentService {

    private final IPublicationCommentRepository commentRepository;
    private final PublicationRepository publicationRepository;
    private final UserRepository userRepository;

    public PublicationCommentService(IPublicationCommentRepository commentRepository,
                                     PublicationRepository publicationRepository,
                                     UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.publicationRepository = publicationRepository;
        this.userRepository = userRepository;
    }

    public PublicationCommentDtos transformEntity(PublicationCommentEntity entity) {
        PublicationCommentDtos dto = new PublicationCommentDtos();

        dto.setId(entity.getId());
        dto.setPublicationId(entity.getPublication().getId());
        dto.setUserId(entity.getUser().getId());
        dto.setComment(entity.getComment());
        dto.setCreationDate(entity.getCreationDate());

        dto.setUser(entity.getUser().getName());
        dto.setUsername(entity.getUser().getUsername());
        dto.setProfilePhoto(entity.getUser().getProfilePhoto());

        return dto;
    }

    @Override
    public PublicationCommentDtos createComment(Long publicationId, Long userId, PublicationCommentDtos dto) {

        PublicationEntity publication = publicationRepository.findById(publicationId).orElse(null);

        if (publication == null) {
            throw new RuntimeException("Publicación no encontrada con id: " + publicationId);
        }

        UserEntity user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            throw new RuntimeException("Usuario no encontrado con id: " + userId);
        }

        PublicationCommentEntity comment = new PublicationCommentEntity();
        comment.setPublication(publication);
        comment.setUser(user);
        comment.setComment(dto.getComment());

        PublicationCommentEntity savedComment = commentRepository.save(comment);

        if (publication.getComents() == null) {
            publication.setComents(0);
        }

        publication.setComents(publication.getComents() + 1);
        publicationRepository.save(publication);

        return transformEntity(savedComment);
    }

    @Override
    public List<PublicationCommentDtos> searchCommentsByPublication(Long publicationId) {
        List<PublicationCommentEntity> entities = commentRepository.findByPublicationId(publicationId);

        List<PublicationCommentDtos> dtos = new ArrayList<>();

        for (PublicationCommentEntity entity : entities) {
            dtos.add(transformEntity(entity));
        }

        return dtos;
    }

    @Override
    public PublicationCommentDtos deleteComment(Long commentId, Long userId) {

        PublicationCommentEntity comment = commentRepository.findById(commentId).orElse(null);

        if (comment == null) {
            throw new RuntimeException("Comentario no encontrado con id: " + commentId);
        }

        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("No tienes permiso para eliminar este comentario");
        }

        PublicationEntity publication = comment.getPublication();

        PublicationCommentDtos deletedComment = transformEntity(comment);

        commentRepository.delete(comment);

        if (publication.getComents() == null || publication.getComents() <= 0) {
            publication.setComents(0);
        } else {
            publication.setComents(publication.getComents() - 1);
        }

        publicationRepository.save(publication);

        return deletedComment;
    }
}