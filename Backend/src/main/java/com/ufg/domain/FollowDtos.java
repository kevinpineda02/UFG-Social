package com.ufg.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowDtos {

    private Long id;

    private Long followerId;
    private String followerName;
    private String followerUsername;
    private String followerProfilePhoto;

    private Long followedId;
    private String followedName;
    private String followedUsername;
    private String followedProfilePhoto;

    private LocalDateTime creationDate;
}