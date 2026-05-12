package com.ufg.controller;


import com.ufg.domain.UserDtos;
import com.ufg.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    UserService userService;

    @PostMapping
    public ResponseEntity createdUser(@RequestBody UserDtos userDtos){
        UserDtos createdUserDtos = userService.createUser(userDtos);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUserDtos);
    }
}
