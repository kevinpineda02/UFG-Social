package com.ufg.service.contract;

import com.ufg.domain.PublicationDtos;

public interface IPublicationLikeService {

    PublicationDtos likePublication(Long publicationId, Long userId);

    PublicationDtos unlikePublication(Long publicationId, Long userId);

    boolean userLikedPublication(Long publicationId, Long userId);

    Integer countLikes(Long publicationId);
}