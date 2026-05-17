package com.ufg.service.contract;

import com.ufg.domain.PublicationImageDtos;

import java.util.List;

public interface IPublicationImageService {

    PublicationImageDtos addImage(Long publicationId, PublicationImageDtos dto);

    List<PublicationImageDtos> searchImagesByPublication(Long publicationId);

    PublicationImageDtos deleteImage(Long imageId);
}