package com.ufg.service.contract;

import com.ufg.data.entity.PublicationEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.domain.PublicationDtos;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IPublication {

    //Transfomar de entidad a objeto
    PublicationDtos transformEntity(PublicationEntity entity);

    //Transformar Objeto a entidad
    PublicationEntity transformObject(PublicationDtos dtos);

    //Leer todas las publicaciones
    List<PublicationDtos> searchPublication();

    //Buscar publicaciones de un usuario
    List<PublicationDtos> searchPublicationUser(Long idUser);


    //Eliminar Publicacion
    PublicationDtos deletePublication(Long id, UserEntity userAuthenticate);

    //Crear Publicacion
    PublicationDtos createPublication(PublicationDtos dtos);

    PublicationDtos createPublicationWithImages(
            Long userId,
            String description,
            String videoUrl,
            List<MultipartFile> files
    );

}
