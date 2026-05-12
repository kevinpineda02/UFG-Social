package com.ufg.service;

import com.ufg.data.entity.UserEntity;
import com.ufg.domain.UserDtos;

public interface IUserService {

    //Metodo para Transformar entidad a objeto
    UserDtos transformEntity(UserEntity entity);

    //Metodo para crear Usuario
     UserDtos createUser(UserDtos userDtos);

     //Metodo de lectura de usuario por id
      UserDtos searchUserId(Long id);
}
