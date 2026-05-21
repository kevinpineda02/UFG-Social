package com.ufg.controller;


import com.ufg.data.entity.UserEntity;
import com.ufg.domain.UserDtos;
import com.ufg.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserRestController {

    @Autowired
    UserService userService;

    @PostMapping
    public ResponseEntity<UserDtos> createdUser(@Valid @RequestBody UserDtos userDtos){
        UserDtos createdUserDtos = userService.createUser(userDtos);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUserDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDtos> UserById(@Valid @PathVariable Long id){
        UserDtos userDtos = userService.searchUserId(id);
        return ResponseEntity.ok(userDtos);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDtos>> searchUsers(){
        List<UserDtos> dtos = userService.searchUsers();
        return ResponseEntity.ok(dtos);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserDtos> editUser(
            @PathVariable Long id,
            @RequestBody UserDtos userDtos) {

        UserDtos userEdited = userService.editUser(id, userDtos);

        return ResponseEntity.ok(userEdited);
    }

}
