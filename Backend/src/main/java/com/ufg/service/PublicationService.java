package com.ufg.service;

import com.ufg.data.entity.PublicationEntity;
import com.ufg.data.entity.PublicationImageEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.IPublicationImageRepository;
import com.ufg.data.repository.PublicationRepository;
import com.ufg.data.repository.UserRepository;
import com.ufg.domain.PublicationDtos;
import com.ufg.domain.PublicationImageDtos;
import com.ufg.service.contract.IImageUploadService;
import com.ufg.service.contract.IPublication;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
public class PublicationService implements IPublication {

    @Autowired
    PublicationRepository publicationRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    IPublicationImageRepository publicationImageRepository;

    @Autowired
    IImageUploadService imageUploadService;

    @Override
    public PublicationDtos transformEntity(PublicationEntity entity) {
        PublicationDtos publicationDtos = new PublicationDtos();

        publicationDtos.setId(entity.getId());
        publicationDtos.setIdUser(entity.getUser().getId());
        publicationDtos.setDescription(entity.getDescription());
        publicationDtos.setVideoUrl(entity.getVideoUrl());
        publicationDtos.setLikes(entity.getLikes());
        publicationDtos.setComents(entity.getComents());
        publicationDtos.setCreationDate(entity.getCreationDate());

        publicationDtos.setUser(entity.getUser().getName());
        publicationDtos.setUsername(entity.getUser().getUsername());
        publicationDtos.setProfilePhoto(entity.getUser().getProfilePhoto());

        List<PublicationImageDtos> imagesDtos = new ArrayList<>();

        if (entity.getImages() != null) {
            for (PublicationImageEntity image : entity.getImages()) {
                PublicationImageDtos imageDto = new PublicationImageDtos();

                imageDto.setId(image.getId());
                imageDto.setImageUrl(image.getImageUrl());
                imageDto.setOrderImage(image.getOrderImage());

                imagesDtos.add(imageDto);
            }
        }

        publicationDtos.setImages(imagesDtos);

        return publicationDtos;
    }

    @Override
    public PublicationEntity transformObject(PublicationDtos dtos) {
        PublicationEntity entity = new PublicationEntity();

        entity.setId(dtos.getId());
        entity.setDescription(dtos.getDescription());
        entity.setVideoUrl(dtos.getVideoUrl());

        if (dtos.getIdUser() != null) {
            UserEntity user = new UserEntity();
            user.setId(dtos.getIdUser());
            entity.setUser(user);
        }

        return entity;
    }

    @Override
    public List<PublicationDtos> searchPublication() {
        List<PublicationEntity> entities = publicationRepository.findAll();

        List<PublicationDtos> dtos = new ArrayList<>();

        for (PublicationEntity entity : entities) {
            dtos.add(transformEntity(entity));
        }

        return dtos;
    }

    @Override
    public List<PublicationDtos> searchPublicationUser(Long idUser) {
        List<PublicationEntity> entities = publicationRepository.findByUserId(idUser);

        List<PublicationDtos> dtos = new ArrayList<>();

        for (PublicationEntity entity : entities) {
            dtos.add(transformEntity(entity));
        }

        return dtos;
    }

    @Override
    @Transactional
    public PublicationDtos deletePublication(Long id, UserEntity authenticatedUser) {
        PublicationEntity publication = publicationRepository.findById(id).orElse(null);

        if (publication == null) {
            throw new RuntimeException("Publication not found with id: " + id);
        }

        UserEntity fullUser = userRepository.findById(authenticatedUser.getId()).orElse(null);

        if (fullUser == null) {
            throw new RuntimeException("Authenticated user not found");
        }

        boolean isOwner = publication.getUser().getId().equals(fullUser.getId());

        boolean isAdmin = fullUser.getCredential() != null
                && fullUser.getCredential().getRol() != null
                && fullUser.getCredential().getRol().name().equalsIgnoreCase("ADMIN");

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("You do not have permission to delete this publication");
        }

        PublicationDtos deletedPublication = transformEntity(publication);

        publicationRepository.delete(publication);

        return deletedPublication;
    }

    @Override
    @Transactional
    public PublicationDtos createPublication(PublicationDtos dtos) {

        UserEntity userFound = userRepository.findById(dtos.getIdUser()).orElse(null);

        if (userFound == null) {
            throw new RuntimeException("Usuario no encontrado con id: " + dtos.getIdUser());
        }

        PublicationEntity entity = new PublicationEntity();

        entity.setUser(userFound);
        entity.setDescription(dtos.getDescription());
        entity.setVideoUrl(dtos.getVideoUrl());
        entity.setLikes(0);
        entity.setComents(0);

        PublicationEntity savedEntity = publicationRepository.save(entity);

        if (dtos.getImages() != null) {
            for (PublicationImageDtos imageDto : dtos.getImages()) {
                PublicationImageEntity image = new PublicationImageEntity();

                image.setPublication(savedEntity);
                image.setImageUrl(imageDto.getImageUrl());

                if (imageDto.getOrderImage() == null) {
                    image.setOrderImage(0);
                } else {
                    image.setOrderImage(imageDto.getOrderImage());
                }

                publicationImageRepository.save(image);
            }
        }

        PublicationDtos response = transformEntity(savedEntity);

        if (dtos.getImages() != null) {
            response.setImages(dtos.getImages());
        }

        return response;
    }

    @Override
    @Transactional
    public PublicationDtos createPublicationWithImages(
            Long userId,
            String description,
            String videoUrl,
            List<MultipartFile> files
    ) {
        UserEntity userFound = userRepository.findById(userId).orElse(null);

        if (userFound == null) {
            throw new RuntimeException("Usuario no encontrado con id: " + userId);
        }

        PublicationEntity entity = new PublicationEntity();

        entity.setUser(userFound);
        entity.setDescription(description);
        entity.setVideoUrl(videoUrl);
        entity.setLikes(0);
        entity.setComents(0);

        PublicationEntity savedEntity = publicationRepository.save(entity);

        List<PublicationImageDtos> imagesResponse = new ArrayList<>();

        if (files != null && !files.isEmpty()) {
            int order = 0;

            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String imageUrl = imageUploadService.uploadImage(
                            file,
                            "ufg_social/publications"
                    );

                    PublicationImageEntity image = new PublicationImageEntity();
                    image.setPublication(savedEntity);
                    image.setImageUrl(imageUrl);
                    image.setOrderImage(order);

                    PublicationImageEntity savedImage = publicationImageRepository.save(image);

                    PublicationImageDtos imageDto = new PublicationImageDtos();
                    imageDto.setId(savedImage.getId());
                    imageDto.setImageUrl(savedImage.getImageUrl());
                    imageDto.setOrderImage(savedImage.getOrderImage());

                    imagesResponse.add(imageDto);

                    order++;
                }
            }
        }

        PublicationDtos response = transformEntity(savedEntity);
        response.setImages(imagesResponse);

        return response;
    }
}