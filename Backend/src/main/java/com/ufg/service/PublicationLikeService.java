package com.ufg.service;

import com.ufg.data.entity.PublicationEntity;
import com.ufg.data.entity.PublicationLikeEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.IPublicationLikeRepository;
import com.ufg.data.repository.PublicationRepository;
import com.ufg.data.repository.UserRepository;
import com.ufg.domain.PublicationDtos;
import com.ufg.service.contract.IPublicationLikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PublicationLikeService implements IPublicationLikeService {

    //Inyectando dependencias
    @Autowired
    private final IPublicationLikeRepository publicationLikeRepository;
    @Autowired
    private final PublicationRepository publicationRepository;
    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private final PublicationService publicationService;

    public PublicationLikeService(IPublicationLikeRepository publicationLikeRepository,
                                  PublicationRepository publicationRepository,
                                  UserRepository userRepository,
                                  PublicationService publicationService) {
        this.publicationLikeRepository = publicationLikeRepository;
        this.publicationRepository = publicationRepository;
        this.userRepository = userRepository;
        this.publicationService = publicationService;
    }

    @Override
    public PublicationDtos likePublication(Long publicationId, Long userId) {

        PublicationEntity publication = publicationRepository.findById(publicationId).orElse(null);

        if (publication == null) {
            throw new RuntimeException("Publicación no encontrada con id: " + publicationId);
        }

        UserEntity user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            throw new RuntimeException("Usuario no encontrado con id: " + userId);
        }

        boolean alreadyLiked = publicationLikeRepository.existsByPublicationIdAndUserId(publicationId, userId);

        if (alreadyLiked) {
            return publicationService.transformEntity(publication);
        }

        PublicationLikeEntity like = new PublicationLikeEntity();
        like.setPublication(publication);
        like.setUser(user);

        publicationLikeRepository.save(like);

        if (publication.getLikes() == null) {
            publication.setLikes(0);
        }

        publication.setLikes(publication.getLikes() + 1);

        PublicationEntity savedPublication = publicationRepository.save(publication);

        return publicationService.transformEntity(savedPublication);
    }

    @Override
    public PublicationDtos unlikePublication(Long publicationId, Long userId) {

        PublicationEntity publication = publicationRepository.findById(publicationId).orElse(null);

        if (publication == null) {
            throw new RuntimeException("Publicación no encontrada con id: " + publicationId);
        }

        UserEntity user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            throw new RuntimeException("Usuario no encontrado con id: " + userId);
        }

        boolean alreadyLiked = publicationLikeRepository.existsByPublicationIdAndUserId(publicationId, userId);

        if (!alreadyLiked) {
            return publicationService.transformEntity(publication);
        }

        publicationLikeRepository.deleteByPublicationIdAndUserId(publicationId, userId);

        if (publication.getLikes() == null || publication.getLikes() <= 0) {
            publication.setLikes(0);
        } else {
            publication.setLikes(publication.getLikes() - 1);
        }

        PublicationEntity savedPublication = publicationRepository.save(publication);

        return publicationService.transformEntity(savedPublication);
    }

    @Override
    public boolean userLikedPublication(Long publicationId, Long userId) {
        return publicationLikeRepository.existsByPublicationIdAndUserId(publicationId, userId);
    }

    @Override
    public Integer countLikes(Long publicationId) {
        return publicationLikeRepository.countByPublicationId(publicationId);
    }
}