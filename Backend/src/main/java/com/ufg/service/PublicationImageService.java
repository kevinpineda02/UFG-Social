package com.ufg.service;

import com.ufg.data.entity.PublicationEntity;
import com.ufg.data.entity.PublicationImageEntity;
import com.ufg.data.repository.IPublicationImageRepository;
import com.ufg.data.repository.PublicationRepository;
import com.ufg.domain.PublicationImageDtos;
import com.ufg.service.contract.IPublicationImageService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PublicationImageService implements IPublicationImageService {

    private final IPublicationImageRepository imageRepository;
    private final PublicationRepository publicationRepository;

    public PublicationImageService(IPublicationImageRepository imageRepository,
                                   PublicationRepository publicationRepository) {
        this.imageRepository = imageRepository;
        this.publicationRepository = publicationRepository;
    }

    public PublicationImageDtos transformEntity(PublicationImageEntity entity) {
        PublicationImageDtos dto = new PublicationImageDtos();

        dto.setId(entity.getId());
        dto.setPublicationId(entity.getPublication().getId());
        dto.setImageUrl(entity.getImageUrl());
        dto.setOrderImage(entity.getOrderImage());

        return dto;
    }

    @Override
    public PublicationImageDtos addImage(Long publicationId, PublicationImageDtos dto) {

        PublicationEntity publication = publicationRepository.findById(publicationId).orElse(null);

        if (publication == null) {
            throw new RuntimeException("Publicación no encontrada con id: " + publicationId);
        }

        PublicationImageEntity image = new PublicationImageEntity();
        image.setPublication(publication);
        image.setImageUrl(dto.getImageUrl());

        if (dto.getOrderImage() == null) {
            image.setOrderImage(0);
        } else {
            image.setOrderImage(dto.getOrderImage());
        }

        PublicationImageEntity savedImage = imageRepository.save(image);

        return transformEntity(savedImage);
    }

    @Override
    public List<PublicationImageDtos> searchImagesByPublication(Long publicationId) {
        List<PublicationImageEntity> entities = imageRepository.findByPublicationId(publicationId);

        List<PublicationImageDtos> dtos = new ArrayList<>();

        for (PublicationImageEntity entity : entities) {
            dtos.add(transformEntity(entity));
        }

        return dtos;
    }

    @Override
    public PublicationImageDtos deleteImage(Long imageId) {

        PublicationImageEntity image = imageRepository.findById(imageId).orElse(null);

        if (image == null) {
            throw new RuntimeException("Imagen no encontrada con id: " + imageId);
        }

        PublicationImageDtos deletedImage = transformEntity(image);

        imageRepository.delete(image);

        return deletedImage;
    }
}