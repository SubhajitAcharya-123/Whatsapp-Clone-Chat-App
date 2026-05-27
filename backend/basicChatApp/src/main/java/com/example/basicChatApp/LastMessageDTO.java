package com.example.basicChatApp;

import java.time.LocalDateTime;

public class LastMessageDTO {

    private String contact;
    private String text;
    private LocalDateTime timestamp;
    private String fileType;

    public LastMessageDTO(String contact, String text, LocalDateTime timestamp, String fileType) {
        this.contact = contact;
        this.text = text;
        this.timestamp = timestamp;
        this.fileType = fileType;
    }

    public LastMessageDTO() {
    }

    public LastMessageDTO(String text, LocalDateTime timestamp, String contact, String fileType) {
        this.text = text;
        this.timestamp = timestamp;
        this.contact = contact;
        this.fileType = fileType;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
