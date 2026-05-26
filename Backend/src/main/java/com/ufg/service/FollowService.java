package com.ufg.service;

import com.ufg.data.entity.FollowEntity;
import com.ufg.data.entity.FollowRequestEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.enums.FollowRequestStatus;
import com.ufg.data.repository.FollowRepository;
import com.ufg.data.repository.FollowRequestRepository;
import com.ufg.data.repository.UserRepository;
import com.ufg.domain.FollowDtos;
import com.ufg.domain.FollowRequestDtos;
import com.ufg.domain.FollowStatusDtos;
import com.ufg.service.contract.IFollowService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FollowService implements IFollowService {

    private final FollowRepository followRepository;
    private final FollowRequestRepository followRequestRepository;
    private final UserRepository userRepository;

    public FollowService(
            FollowRepository followRepository,
            FollowRequestRepository followRequestRepository,
            UserRepository userRepository
    ) {
        this.followRepository = followRepository;
        this.followRequestRepository = followRequestRepository;
        this.userRepository = userRepository;
    }

    public FollowDtos transformFollowEntity(FollowEntity entity) {
        FollowDtos dto = new FollowDtos();

        dto.setId(entity.getId());

        dto.setFollowerId(entity.getFollower().getId());
        dto.setFollowerName(entity.getFollower().getName());
        dto.setFollowerUsername(entity.getFollower().getUsername());
        dto.setFollowerProfilePhoto(entity.getFollower().getProfilePhoto());

        dto.setFollowedId(entity.getFollowed().getId());
        dto.setFollowedName(entity.getFollowed().getName());
        dto.setFollowedUsername(entity.getFollowed().getUsername());
        dto.setFollowedProfilePhoto(entity.getFollowed().getProfilePhoto());

        dto.setCreationDate(entity.getCreationDate());

        return dto;
    }

    public FollowRequestDtos transformRequestEntity(FollowRequestEntity entity) {
        FollowRequestDtos dto = new FollowRequestDtos();

        dto.setId(entity.getId());

        dto.setRequesterId(entity.getRequester().getId());
        dto.setRequesterName(entity.getRequester().getName());
        dto.setRequesterUsername(entity.getRequester().getUsername());
        dto.setRequesterProfilePhoto(entity.getRequester().getProfilePhoto());

        dto.setReceiverId(entity.getReceiver().getId());
        dto.setReceiverName(entity.getReceiver().getName());
        dto.setReceiverUsername(entity.getReceiver().getUsername());
        dto.setReceiverProfilePhoto(entity.getReceiver().getProfilePhoto());

        dto.setStatus(entity.getStatus().name());
        dto.setCreationDate(entity.getCreationDate());

        return dto;
    }

    @Override
    @Transactional
    public FollowRequestDtos sendRequest(Long requesterId, Long receiverId) {

        if (requesterId == null || receiverId == null) {
            throw new RuntimeException("Los IDs de usuario no pueden ser nulos");
        }

        if (requesterId.equals(receiverId)) {
            throw new RuntimeException("No puedes enviarte solicitud a ti mismo");
        }

        UserEntity requester = userRepository.findById(requesterId).orElse(null);
        UserEntity receiver = userRepository.findById(receiverId).orElse(null);

        if (requester == null) {
            throw new RuntimeException("Usuario solicitante no encontrado con id: " + requesterId);
        }

        if (receiver == null) {
            throw new RuntimeException("Usuario receptor no encontrado con id: " + receiverId);
        }

        boolean alreadyFollowing = followRepository.existsByFollowerIdAndFollowedId(
                requesterId,
                receiverId
        );

        if (alreadyFollowing) {
            throw new RuntimeException("Ya sigues a este usuario");
        }

        /*
         * Corrección importante:
         * Antes solo se buscaba una solicitud PENDIENTE.
         * Si existía una solicitud vieja ACEPTADA o RECHAZADA, el sistema intentaba insertar
         * otra fila con el mismo requesterId y receiverId, causando:
         *
         * Duplicate entry 'requesterId-receiverId' for key 'uq_solicitud_unica'
         *
         * Ahora se busca cualquier solicitud previa entre ambos usuarios.
         * Si existe, se reutiliza cambiando su estado a PENDIENTE.
         */
        FollowRequestEntity existingRequest = followRequestRepository
                .findByRequesterIdAndReceiverId(requesterId, receiverId)
                .orElse(null);

        if (existingRequest != null) {

            if (existingRequest.getStatus() == FollowRequestStatus.PENDIENTE) {
                throw new RuntimeException("Ya existe una solicitud pendiente para este usuario");
            }

            existingRequest.setStatus(FollowRequestStatus.PENDIENTE);

            FollowRequestEntity updatedRequest = followRequestRepository.save(existingRequest);

            return transformRequestEntity(updatedRequest);
        }

        FollowRequestEntity request = new FollowRequestEntity();
        request.setRequester(requester);
        request.setReceiver(receiver);
        request.setStatus(FollowRequestStatus.PENDIENTE);

        FollowRequestEntity savedRequest = followRequestRepository.save(request);

        return transformRequestEntity(savedRequest);
    }

    @Override
    @Transactional
    public void cancelRequest(Long requesterId, Long receiverId) {

        FollowRequestEntity request = followRequestRepository
                .findByRequesterIdAndReceiverIdAndStatus(
                        requesterId,
                        receiverId,
                        FollowRequestStatus.PENDIENTE
                )
                .orElse(null);

        if (request == null) {
            throw new RuntimeException("No existe solicitud pendiente para cancelar");
        }

        followRequestRepository.delete(request);
    }

    @Override
    @Transactional
    public FollowRequestDtos acceptRequest(Long requestId) {

        FollowRequestEntity request = followRequestRepository.findById(requestId).orElse(null);

        if (request == null) {
            throw new RuntimeException("Solicitud no encontrada con id: " + requestId);
        }

        if (request.getStatus() != FollowRequestStatus.PENDIENTE) {
            throw new RuntimeException("La solicitud ya fue procesada");
        }

        Long requesterId = request.getRequester().getId();
        Long receiverId = request.getReceiver().getId();

        boolean alreadyFollowing = followRepository.existsByFollowerIdAndFollowedId(
                requesterId,
                receiverId
        );

        if (!alreadyFollowing) {
            FollowEntity follow = new FollowEntity();
            follow.setFollower(request.getRequester());
            follow.setFollowed(request.getReceiver());

            followRepository.save(follow);
        }

        request.setStatus(FollowRequestStatus.ACEPTADA);

        FollowRequestEntity savedRequest = followRequestRepository.save(request);

        return transformRequestEntity(savedRequest);
    }

    @Override
    @Transactional
    public FollowRequestDtos rejectRequest(Long requestId) {

        FollowRequestEntity request = followRequestRepository.findById(requestId).orElse(null);

        if (request == null) {
            throw new RuntimeException("Solicitud no encontrada con id: " + requestId);
        }

        if (request.getStatus() != FollowRequestStatus.PENDIENTE) {
            throw new RuntimeException("La solicitud ya fue procesada");
        }

        request.setStatus(FollowRequestStatus.RECHAZADA);

        FollowRequestEntity savedRequest = followRequestRepository.save(request);

        return transformRequestEntity(savedRequest);
    }

    @Override
    public List<FollowRequestDtos> getPendingRequests(Long receiverId) {

        List<FollowRequestEntity> requests = followRequestRepository.findByReceiverIdAndStatus(
                receiverId,
                FollowRequestStatus.PENDIENTE
        );

        List<FollowRequestDtos> dtos = new ArrayList<>();

        for (FollowRequestEntity request : requests) {
            dtos.add(transformRequestEntity(request));
        }

        return dtos;
    }

    @Override
    public List<FollowRequestDtos> getSentRequests(Long requesterId) {

        List<FollowRequestEntity> requests = followRequestRepository.findByRequesterIdAndStatus(
                requesterId,
                FollowRequestStatus.PENDIENTE
        );

        List<FollowRequestDtos> dtos = new ArrayList<>();

        for (FollowRequestEntity request : requests) {
            dtos.add(transformRequestEntity(request));
        }

        return dtos;
    }

    @Override
    public List<FollowDtos> getFollowers(Long userId) {

        List<FollowEntity> followers = followRepository.findByFollowedId(userId);

        List<FollowDtos> dtos = new ArrayList<>();

        for (FollowEntity follow : followers) {
            dtos.add(transformFollowEntity(follow));
        }

        return dtos;
    }

    @Override
    public List<FollowDtos> getFollowing(Long userId) {

        List<FollowEntity> following = followRepository.findByFollowerId(userId);

        List<FollowDtos> dtos = new ArrayList<>();

        for (FollowEntity follow : following) {
            dtos.add(transformFollowEntity(follow));
        }

        return dtos;
    }

    @Override
    @Transactional
    public void unfollow(Long followerId, Long followedId) {

        FollowEntity follow = followRepository
                .findByFollowerIdAndFollowedId(followerId, followedId)
                .orElse(null);

        if (follow == null) {
            throw new RuntimeException("No existe relación de seguimiento");
        }

        followRepository.delete(follow);
    }

    @Override
    public Long countFollowers(Long userId) {
        return followRepository.countByFollowedId(userId);
    }

    @Override
    public Long countFollowing(Long userId) {
        return followRepository.countByFollowerId(userId);
    }

    @Override
    public FollowStatusDtos getFollowStatus(Long requesterId, Long targetUserId) {

        if (requesterId == null || targetUserId == null) {
            return new FollowStatusDtos(requesterId, targetUserId, "NONE");
        }

        if (requesterId.equals(targetUserId)) {
            return new FollowStatusDtos(requesterId, targetUserId, "SELF");
        }

        boolean alreadyFollowing = followRepository.existsByFollowerIdAndFollowedId(
                requesterId,
                targetUserId
        );

        if (alreadyFollowing) {
            return new FollowStatusDtos(requesterId, targetUserId, "FOLLOWING");
        }

        boolean pendingSent = followRequestRepository
                .findByRequesterIdAndReceiverIdAndStatus(
                        requesterId,
                        targetUserId,
                        FollowRequestStatus.PENDIENTE
                )
                .isPresent();

        if (pendingSent) {
            return new FollowStatusDtos(requesterId, targetUserId, "PENDING_SENT");
        }

        boolean pendingReceived = followRequestRepository
                .findByRequesterIdAndReceiverIdAndStatus(
                        targetUserId,
                        requesterId,
                        FollowRequestStatus.PENDIENTE
                )
                .isPresent();

        if (pendingReceived) {
            return new FollowStatusDtos(requesterId, targetUserId, "PENDING_RECEIVED");
        }

        return new FollowStatusDtos(requesterId, targetUserId, "NONE");
    }
}