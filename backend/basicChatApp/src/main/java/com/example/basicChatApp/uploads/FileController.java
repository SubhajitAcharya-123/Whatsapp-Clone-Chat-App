package com.example.basicChatApp.uploads;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/file")
@CrossOrigin(origins = "http://localhost:3000")
public class FileController {

    private final CloudinaryService cloudinaryService;

    public FileController(
            CloudinaryService cloudinaryService
    ) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/upload")
    public Map<String, String> uploadFile(
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        Map<String, String> response = cloudinaryService.uploadFile(file);
        System.out.println("in file controller before return : " + response.get("fileType"));
        return Map.of(
                "url", response.get("url"),
                "fileType", response.get("fileType")
        );
    }
}
