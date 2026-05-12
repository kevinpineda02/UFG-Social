package com.ufg.service;

import com.ufg.auth.AuthResponse;
import com.ufg.domain.LoginRequest;
import com.ufg.domain.RegisterRequest;
import com.ufg.data.entity.Rol;
import com.ufg.data.entity.CredentialEntity;
import com.ufg.data.repository.CredentialRepository;
import com.ufg.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CredentialRepository credentialRepository;
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
        UserDetails user = credentialRepository.findByCorreo(request.getCorreo())
                .orElseThrow();

        String token = jwtService.getToken(user);

        return AuthResponse.builder()
                .token(token)
                .build();
    }

    //Metodo de Registro de usuarios
    public AuthResponse register(RegisterRequest request) {
        CredentialEntity user = CredentialEntity.builder()
                .correo(request.getCorreo())
                .contrasena(passwordEncoder.encode(request.getContrasena()))
                .rol(Rol.USER)
                .build();

        // Guardar usuario
        CredentialEntity savedUser = credentialRepository.save(user);

        // Generar token con el ID
        String token = jwtService.getToken(savedUser);

        // RETORNAR TAMBIÉN EL ID
        return AuthResponse.builder()
                .token(token)
                .credentialId(savedUser.getId())
                .build();
    }
}
