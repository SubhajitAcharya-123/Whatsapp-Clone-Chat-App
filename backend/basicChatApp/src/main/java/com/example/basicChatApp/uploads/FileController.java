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

    private final String UPLOAD_DIR = "uploads/";

    @PostMapping("/upload")
    public Map<String, String> uploadFile(
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

        Path path = Paths.get(UPLOAD_DIR + fileName);

        Files.createDirectories(path.getParent());
        Files.write(path, file.getBytes());

        String fileUrl = "http://localhost:8080/uploads/" + fileName;

        return Map.of("url", fileUrl);
    }
}
