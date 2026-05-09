package com.example.basicChatApp;

import java.time.LocalDateTime;

public class LastMessageDTO {

    private String contact;
    private String text;
    private LocalDateTime timestamp;

    public LastMessageDTO(String contact, String text, LocalDateTime timestamp) {
        this.contact = contact;
        this.text = text;
        this.timestamp = timestamp;
    }

    public LastMessageDTO() {
    }

    public LastMessageDTO(String text, LocalDateTime timestamp, String contact) {
        this.text = text;
        this.timestamp = timestamp;
        this.contact = contact;
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
