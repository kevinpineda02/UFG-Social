package com.ufg.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowRequestDtos {

    private Long id;

    private Long requesterId;
    private String requesterName;
    private String requesterUsername;
    private String requesterProfilePhoto;

    private Long receiverId;
    private String receiverName;
    private String receiverUsername;
    private String receiverProfilePhoto;

    private String status;

    private LocalDateTime creationDate;
}