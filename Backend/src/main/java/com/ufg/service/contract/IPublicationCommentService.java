package com.ufg.service.contract;

import com.ufg.domain.PublicationCommentDtos;

import java.util.List;

public interface IPublicationCommentService {

    PublicationCommentDtos createComment(Long publicationId, Long userId, PublicationCommentDtos dto);

    List<PublicationCommentDtos> searchCommentsByPublication(Long publicationId);

    PublicationCommentDtos deleteComment(Long commentId, Long userId);

}
