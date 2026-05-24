package com.ufg.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowStatusDtos {

    private Long requesterId;
    private Long targetUserId;
    private String status;
}