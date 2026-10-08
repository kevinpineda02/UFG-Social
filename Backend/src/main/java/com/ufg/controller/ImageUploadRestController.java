package com.ufg.controller;

import com.ufg.service.contract.IImageUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/images")
public class ImageUploadRestController {

    private final IImageUploadService imageUploadService;

    // Constructor para inyectar la dependencia del servicio de subida de imágenes
    @Autowired
    public ImageUploadRestController(IImageUploadService imageUploadService) {
        this.imageUploadService = imageUploadService;
    }

    // Endpoint para subir una imagen
    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestPart("file") MultipartFile file
    ) {
        String imageUrl = imageUploadService.uploadImage(file, "ufg_social");

        return ResponseEntity.ok(Map.of("url", imageUrl));
    }
}