package com.ufg.service;

import com.ufg.data.entity.CredentialEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.UserRepository;
import com.ufg.domain.UserDtos;
import com.ufg.service.contract.IImageUploadService;
import com.ufg.service.contract.IUserService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService implements IUserService {

    private final UserRepository userRepository;
    private final IImageUploadService imageUploadService;

    public UserService(UserRepository userRepository,
                       IImageUploadService imageUploadService) {
        this.userRepository = userRepository;
        this.imageUploadService = imageUploadService;
    }

    @Override
    public UserDtos transformEntity(UserEntity entity) {
        UserDtos userDtos = new UserDtos();

        userDtos.setId(entity.getId());
        userDtos.setName(entity.getName());
        userDtos.setUsername(entity.getUsername());
        userDtos.setProfilePhoto(entity.getProfilePhoto());
        userDtos.setCreationDate(entity.getCreationDate());
        userDtos.setFollowers(entity.getFollowers());
        userDtos.setFollowed(entity.getFollowed());

        if (entity.getCredential() != null) {
            userDtos.setCredentialId(entity.getCredential().getId());
        }

        return userDtos;
    }

    public UserEntity transformToEntity(UserDtos userDtos) {
        UserEntity entity = new UserEntity();

        entity.setId(userDtos.getId());
        entity.setName(userDtos.getName());
        entity.setUsername(userDtos.getUsername());
        entity.setProfilePhoto(userDtos.getProfilePhoto());
        entity.setCreationDate(userDtos.getCreationDate());
        entity.setFollowers(userDtos.getFollowers());
        entity.setFollowed(userDtos.getFollowed());

        if (userDtos.getCredentialId() != null) {
            CredentialEntity credential = new CredentialEntity();
            credential.setId(userDtos.getCredentialId());
            entity.setCredential(credential);
        }

        return entity;
    }

    @Override
    public UserDtos createUser(UserDtos userDtos) {
        UserEntity entity = transformToEntity(userDtos);

        UserEntity saveEntity = userRepository.save(entity);

        return transformEntity(saveEntity);
    }

    @Override
    public UserDtos searchUserId(Long id) {
        UserEntity entity = userRepository.findById(id).orElse(null);

        if (entity == null) {
            return null;
        }

        return transformEntity(entity);
    }

    @Override
    public List<UserDtos> searchUsers() {
        List<UserEntity> entities = userRepository.findAll();

        List<UserDtos> usersDtos = new ArrayList<>();

        for (UserEntity user : entities) {
            usersDtos.add(transformEntity(user));
        }

        return usersDtos;
    }

    @Override
    public UserDtos editUser(Long id, UserDtos userDtos) {
        UserEntity entity = userRepository.findById(id).orElse(null);

        if (entity == null) {
            throw new RuntimeException("Usuario no encontrado con id: " + id);
        }

        if (userDtos.getName() != null && !userDtos.getName().isBlank()) {
            entity.setName(userDtos.getName());
        }

        if (userDtos.getUsername() != null && !userDtos.getUsername().isBlank()) {
            entity.setUsername(userDtos.getUsername());
        }

        UserEntity savedEntity = userRepository.save(entity);

        return transformEntity(savedEntity);
    }

    @Override
    public List<UserDtos> getSuggestions(Long userId) {
        List<UserEntity> entities = userRepository.findSuggestions(userId);

        List<UserDtos> usersDtos = new ArrayList<>();

        for (UserEntity user : entities) {
            usersDtos.add(transformEntity(user));
        }

        return usersDtos;
    }

    @Override
    public UserDtos updateProfilePhoto(Long id, MultipartFile file) {
        UserEntity entity = userRepository.findById(id).orElse(null);

        if (entity == null) {
            throw new RuntimeException("Usuario no encontrado con id: " + id);
        }

        String imageUrl = imageUploadService.uploadImage(file, "ufg_social/profile_photos");

        entity.setProfilePhoto(imageUrl);

        UserEntity savedEntity = userRepository.save(entity);

        return transformEntity(savedEntity);
    }
}