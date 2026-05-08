package com.ufg.service;

import com.ufg.auth.AuthResponse;
import com.ufg.auth.LoginRequest;
import com.ufg.auth.RegisterRequest;
import com.ufg.data.entity.Rol;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.UserRepository;
import com.ufg.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    //Metodo de Logeuo de usuarios
    public AuthResponse login(LoginRequest request) {
        // Autenticar sin retornar
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getContrasena())
        );

        //Si la autenticación falla lanza excepción, si pasa busca el usuario
        UserDetails user = userRepository.findByCorreo(request.getCorreo())
                .orElseThrow();

        String token = jwtService.getToken(user);

        return AuthResponse.builder()
                .token(token)
                .build();
    }

    //Metodo de Registro de usuarios
    public AuthResponse register(RegisterRequest request) {
        UserEntity user = UserEntity.builder()
                .correo(request.getCorreo())
                .contrasena(passwordEncoder.encode(request.getContrasena()))
                .rol(Rol.USER)
                .build();

        //Guardamos usuario
        userRepository.save(user);

        //se manda token
        return AuthResponse.builder().
                token(jwtService.getToken(user))
                .build();
    }
}
