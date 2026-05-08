package com.ufg.service;

import com.ufg.auth.AuthResponse;
import com.ufg.auth.LoginRequest;
import com.ufg.auth.RegisterRequest;
import com.ufg.data.entity.Role;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.UserRepository;
import com.ufg.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    //Metodo de Logeuo de usuarios
    public AuthResponse login(LoginRequest request) {
        return null;
    }

    //Metodo de Registro de usuarios
    public AuthResponse register(RegisterRequest request) {
        UserEntity user = UserEntity.builder()
                .correo(request.getCorreo())
                .contrasena(request.getContrasena())
                .role(Role.USER)
                .build();

        userRepository.save(user);

        return AuthResponse.builder().
                token(jwtService.getToken(user))
                .build();
    }
}
