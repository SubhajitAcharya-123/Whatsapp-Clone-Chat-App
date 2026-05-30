package com.example.basicChatApp.uploads;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Map<String, String> uploadFile(MultipartFile file) throws IOException {

        String contentType = file.getContentType();
        System.out.println("CONTENT TYPE = " + file.getContentType());
        String fileType;

        if (contentType != null && contentType.startsWith("image")) {
            fileType = "image";
        } else if ("application/pdf".equals(contentType)) {
            fileType = "pdf";
        } else {
            fileType = "file";
        }

        // 2. Decide Cloudinary resource type (FOR STORAGE)
        String resourceType;

        if (contentType != null && contentType.startsWith("image")) {
            resourceType = "image";
        } else {
            resourceType = "raw";
        }
        System.out.println("RESOURCE TYPE = " + resourceType);
        File tempFile = File.createTempFile("upload_", file.getOriginalFilename());
        file.transferTo(tempFile);

        Map<?, ?> result = cloudinary.uploader().upload(
                tempFile,
                ObjectUtils.asMap(
                        "resource_type", resourceType
                )
        );
        System.out.println("RESULT = " + result);
        tempFile.delete();
        System.out.println("in cloud service before return : " + fileType);
        // 4. Return BOTH URL + fileType
        return Map.of(
                "url", result.get("secure_url").toString(),
                "fileType", fileType
        );
    }
}
