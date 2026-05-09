package com.example.basicChatApp;

import jakarta.persistence.*;

import java.time.LocalDateTime;
@Entity
@Table(name="messagebox")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomId;
    private String sender;
    private String receiver;
    private String content;
    private LocalDateTime timestamp;
    private String status;
    private String fileUrl;
    private String fileType; // image / file

    public Message() {}

    public Message(String sender, String content, LocalDateTime timestamp, String roomId, String receiver, String status, String fileType, String fileUrl) {
        this.sender = sender;
        this.content = content;
        this.timestamp = timestamp;
        this.roomId = roomId;
        this.receiver = receiver;
        this.status = status;
        this.fileType = fileType;
        this.fileUrl = fileUrl;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }
}
