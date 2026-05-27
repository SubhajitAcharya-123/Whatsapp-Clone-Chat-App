//package com.example.basicChatApp.uploads;
//
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
//import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
//
//import java.nio.file.Path;
//import java.nio.file.Paths;
//
//@Configuration
//public class WebConfig implements WebMvcConfigurer {
//    @Override
//    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        Path uploadDir = Paths.get("uploads");
//
//        System.out.println(
//                "UPLOAD ABSOLUTE PATH = "
//                        + uploadDir.toAbsolutePath()
//        );
//        registry.addResourceHandler("/uploads/**")
//                .addResourceLocations("file:uploads/");
//    }
//}
