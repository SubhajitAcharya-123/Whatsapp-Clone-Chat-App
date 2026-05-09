package com.example.basicChatApp;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class OnlineStatusPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final OnlineUserService onlineUserService;

    public OnlineStatusPublisher(SimpMessagingTemplate messagingTemplate,
                                 OnlineUserService onlineUserService) {
        this.messagingTemplate = messagingTemplate;
        this.onlineUserService = onlineUserService;
    }

    public void broadcast() {
        messagingTemplate.convertAndSend(
                "/topic/online",
                onlineUserService.getOnlineUsers()
        );
    }
}
