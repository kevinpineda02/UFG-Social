package com.ufg.controller;

import com.ufg.dto.UserDtos;
import com.ufg.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserRestController {

    //Inyeccion de dependencias
    @Autowired
    UserService userService;

    // Endpoint para crear un usuario
    @PostMapping
    public ResponseEntity<UserDtos> createdUser(@Valid @RequestBody UserDtos userDtos) {
        UserDtos createdUserDtos = userService.createUser(userDtos);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUserDtos);
    }

    // Endpoint para buscar un usuario por id
    @GetMapping("/{id}")
    public ResponseEntity<UserDtos> userById(@PathVariable Long id) {
        UserDtos userDtos = userService.searchUserId(id);
        return ResponseEntity.ok(userDtos);
    }

    // Endpoint para buscar todos los usuarios
    @GetMapping("/users")
    public ResponseEntity<List<UserDtos>> searchUsers() {
        List<UserDtos> dtos = userService.searchUsers();
        return ResponseEntity.ok(dtos);
    }

    // Endpoint para editar un usuario
    @PatchMapping("/{id}")
    public ResponseEntity<UserDtos> editUser(
            @PathVariable Long id,
            @RequestBody UserDtos userDtos) {

        UserDtos userEdited = userService.editUser(id, userDtos);

        return ResponseEntity.ok(userEdited);
    }

    // Endpoint para actualizar la foto de perfil de un usuario
    @PatchMapping(
            value = "/{id}/profile-photo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<UserDtos> updateProfilePhoto(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {

        UserDtos updatedUser = userService.updateProfilePhoto(id, file);

        return ResponseEntity.ok(updatedUser);
    }

    // Endpoint para obtener sugerencias de usuarios
    @GetMapping("/suggestions/{userId}")
    public ResponseEntity<List<UserDtos>> getSuggestions(@PathVariable Long userId) {
        List<UserDtos> suggestions = userService.getSuggestions(userId);
        return ResponseEntity.ok(suggestions);
    }
}