package com.ufg.service;

import com.ufg.auth.AuthResponse;
import com.ufg.data.entity.UserEntity;
import com.ufg.data.repository.UserRepository;
import com.ufg.dto.LoginRequest;
import com.ufg.dto.RegisterRequest;
import com.ufg.data.Rol;
import com.ufg.data.entity.CredentialEntity;
import com.ufg.data.repository.CredentialRepository;
import com.ufg.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CredentialRepository credentialRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;

    //Metodo de Login de usuarios
    public AuthResponse login(LoginRequest request) {
        // 1. Autenticar correo y contraseña
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getContrasena())
        );

        // 2. Buscar la credencial
        CredentialEntity credential = credentialRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // 3. Buscar el usuario usando el credentialId (con guion bajo)
        UserEntity user = userRepository.findByCredential_Id(credential.getId())
                .orElseThrow(() -> new RuntimeException("Perfil de usuario no encontrado"));

        // 4. Generar token
        String token = jwtService.getToken(credential);

        // 5. Retornar token, credentialId y userId
        return AuthResponse.builder()
                .token(token)
                .credentialId(credential.getId())
                .userId(user.getId())
                .rol(credential.getRol().name())
                .build();
    }

    public AuthResponse register(RegisterRequest request) {

        credentialRepository.findByCorreo(request.getCorreo())
                .ifPresent(user -> {
                    throw new RuntimeException("El correo ya está registrado");
                });

        CredentialEntity user = CredentialEntity.builder()
                .correo(request.getCorreo())
                .contrasena(passwordEncoder.encode(request.getContrasena()))
                .rol(Rol.USER)
                .build();

        CredentialEntity savedUser = credentialRepository.save(user);

        String token = jwtService.getToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .credentialId(savedUser.getId())
                .build();
    }
}