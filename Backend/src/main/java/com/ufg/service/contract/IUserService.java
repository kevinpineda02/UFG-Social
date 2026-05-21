package com.ufg.service.contract;

import com.ufg.data.entity.UserEntity;
import com.ufg.domain.UserDtos;

import java.util.List;

public interface IUserService {

    //Metodo para Transformar entidad a objeto
    UserDtos transformEntity(UserEntity entity);

    //Metodo para crear Usuario
     UserDtos createUser(UserDtos userDtos);

     //Metodo de lectura de usuario por id
      UserDtos searchUserId(Long id);

      //Metodo para lectura de todos los usuarios
      List<UserDtos>  searchUsers();

      //Editar Usuario
      UserDtos editUser(Long id, UserDtos userDtos);
}
