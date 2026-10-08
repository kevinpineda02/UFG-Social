package com.ufg.controller;

import com.ufg.auth.AuthResponse;
import com.ufg.dto.LoginRequest;
import com.ufg.dto.RegisterRequest;
import com.ufg.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Controlador REST para la autenticación de usuarios
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthRestController {

    // Inyección de dependencias del servicio de autenticación
    private final AuthService authService;

    // Endpoint para iniciar sesión
    @PostMapping(value = "/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request){

        return ResponseEntity.ok(authService.login(request));
    }

    // Endpoint para registrar un nuevo usuario
    @PostMapping(value = "/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request){
      return ResponseEntity.ok(authService.register(request));
    }
}
