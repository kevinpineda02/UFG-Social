package com.ufg.service.contract;

import com.ufg.data.entity.PublicationEntity;
import com.ufg.data.entity.UserEntity;
import com.ufg.domain.PublicationDtos;

import java.util.List;

public interface IPublication {

    //Transfomar de entidad a objeto
    PublicationDtos transformEntity(PublicationEntity entity);

    //Leer todas las publicaciones
    List<PublicationDtos> searchPublication();

    //Leer publicacion de un usuario
    PublicationDtos searchPublicationUser(Long id);

    //Eliminar Publicacion
    PublicationDtos deletePublication(Long id, UserEntity userAuthenticate);

    //Editar Publicacion
    PublicationDtos editPublication(Long id);

    //Crear Publicacion
    PublicationDtos createPublication(PublicationEntity entity, UserEntity user);
}
