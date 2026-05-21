package com.ufg.service;


import com.ufg.data.entity.CredentialEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.UserRepository;
import com.ufg.domain.UserDtos;
import com.ufg.service.contract.IUserService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService implements IUserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //Transformar Entidad
    @Override
    public UserDtos transformEntity(UserEntity entity) {
        UserDtos userDtos = new UserDtos();
        userDtos.setId(entity.getId());
        userDtos.setName(entity.getName());
        userDtos.setUsername(entity.getUsername());
        userDtos.setProfilePhoto(entity.getProfilePhoto());
        userDtos.setCreationDate(entity.getCreationDate());


        if (entity.getCredential() != null) {
            userDtos.setCredentialId(entity.getCredential().getId());
        }
        return userDtos;
    }

    //Transformar el usuario a entidad
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

    //Crear Usuario
    @Override
    public UserDtos createUser(UserDtos userDtos) {
        //Transforma el Dto a entidad
        UserEntity entity = transformToEntity(userDtos);

        //Guardar en la base de datos
        UserEntity saveEntity = userRepository.save(entity);

        return transformEntity(saveEntity);
    }

    //Buscar Usuario Por ID
    @Override
    public UserDtos searchUserId(Long id) {

        UserEntity entity = userRepository.findById(id).orElse(null);

        if(entity == null){
            return null;
        }

        return transformEntity(entity);
    }

    //Buscar por usuario
    @Override
    public List<UserDtos> searchUsers() {
        List<UserEntity> entities = userRepository.findAll();

        List<UserDtos> usersDtos = new ArrayList<>();

        for(UserEntity user : entities){
            usersDtos.add(transformEntity(user));
        }

        return usersDtos;
    }

    //Editar información del usuario
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

        if (userDtos.getProfilePhoto() != null && !userDtos.getProfilePhoto().isBlank()) {
            entity.setProfilePhoto(userDtos.getProfilePhoto());
        }

        UserEntity savedEntity = userRepository.save(entity);

        return transformEntity(savedEntity);
    }


}
