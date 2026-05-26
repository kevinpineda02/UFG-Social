package com.ufg.service.contract;

import org.springframework.web.multipart.MultipartFile;

public interface IImageUploadService {

    String uploadImage(MultipartFile file, String folder);
    String uploadVideo(MultipartFile file, String folder);
}