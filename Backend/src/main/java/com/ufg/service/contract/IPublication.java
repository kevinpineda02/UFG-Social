package com.ufg.service.contract;

import com.ufg.data.entity.PublicationEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.domain.PublicationDtos;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IPublication {

    // Transformar de entidad a DTO
    PublicationDtos transformEntity(PublicationEntity entity);

    // Transformar DTO a entidad
    PublicationEntity transformObject(PublicationDtos dtos);

    // Leer todas las publicaciones
    List<PublicationDtos> searchPublication();

    // Buscar publicaciones de un usuario
    List<PublicationDtos> searchPublicationUser(Long idUser);

    // Eliminar publicacion
    PublicationDtos deletePublication(Long id, UserEntity userAuthenticate);

    // Crear publicacion final con imagenes o video
    PublicationDtos createPublication(
            Long userId,
            String description,
            List<MultipartFile> files,
            MultipartFile videoFile
    );
}