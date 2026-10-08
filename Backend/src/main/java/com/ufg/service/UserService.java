package com.ufg.service;

import com.ufg.data.entity.CredentialEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.UserRepository;
import com.ufg.dto.UserDtos;
import com.ufg.service.contract.IImageUploadService;
import com.ufg.service.contract.IUserService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

// Servicio con la lógica de negocio de los usuarios (crear, buscar, editar, sugerencias y foto de perfil)
@Service
public class UserService implements IUserService {

    // Accede a la base de datos de usuarios
    private final UserRepository userRepository;
    // Sube las imágenes al almacenamiento externo
    private final IImageUploadService imageUploadService;

    // Constructor: Spring inyecta aquí el repositorio y el servicio de imágenes
    public UserService(UserRepository userRepository,
                       IImageUploadService imageUploadService) {
        this.userRepository = userRepository;
        this.imageUploadService = imageUploadService;
    }

    // Convierte una entidad (BD) a DTO (lo que se envía al cliente)
    @Override
    public UserDtos transformEntity(UserEntity entity) {

        Long credentialId = entity.getCredential() != null
                ? entity.getCredential().getId()
                : null;

        return UserDtos.builder()
                .id(entity.getId())
                .name(entity.getName())
                .username(entity.getUsername())
                .profilePhoto(entity.getProfilePhoto())
                .creationDate(entity.getCreationDate())
                .followers(entity.getFollowers())
                .followed(entity.getFollowed())
                .credentialId(credentialId)
                .build();
    }

    // Convierte un DTO (del cliente) a entidad (para guardar en BD)
    public UserEntity transformToEntity(UserDtos userDtos) {

        CredentialEntity credential = Optional.ofNullable(userDtos.getCredentialId())
                .map(id -> CredentialEntity.builder()
                        .id(id)
                        .build())
                .orElse(null);

        return UserEntity.builder()
                .id(userDtos.getId())
                .name(userDtos.getName())
                .username(userDtos.getUsername())
                .profilePhoto(userDtos.getProfilePhoto())
                .creationDate(userDtos.getCreationDate())
                .followers(userDtos.getFollowers())
                .followed(userDtos.getFollowed())
                .credential(credential)
                .build();
    }

    // Crea un usuario nuevo y devuelve el usuario guardado
    @Override
    public UserDtos createUser(UserDtos userDtos) {
        UserEntity entity = transformToEntity(userDtos);

        UserEntity saveEntity = userRepository.save(entity);

        return transformEntity(saveEntity);
    }

    // Busca un usuario por su id (devuelve null si no existe)
    @Override
    public UserDtos searchUserId(Long id){
        return userRepository.findAll()
                .stream()
                .filter(userEntity -> userEntity.getId().equals(id))
                .map(this::transformEntity)
                .findFirst()
                .orElse(null);
    }



    // Devuelve la lista de todos los usuarios
    @Override
    public List<UserDtos> searchUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::transformEntity)
                .toList();
    }

    // Edita el nombre y el username de un usuario existente
    @Override
    public UserDtos editUser(Long id, UserDtos userDtos) {
        UserEntity entity = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Usuario no encontrado id:" + id)
                );

        Optional.ofNullable(userDtos.getName())
                .filter(name -> !name.isBlank())
                .ifPresent(entity::setName);

        Optional.ofNullable(userDtos.getName())
                .filter(username -> !username.isBlank())
                .ifPresent(entity::setUsername);

        return transformEntity(userRepository.save(entity));
    }


    // Devuelve usuarios sugeridos para el usuario indicado
    @Override
    public List<UserDtos> getSuggestions(Long userId){
        return userRepository.findSuggestions(userId)
                .stream()
                .map(this::transformEntity)
                .toList();
    }

    // Sube una nueva foto de perfil y guarda su URL en el usuario
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