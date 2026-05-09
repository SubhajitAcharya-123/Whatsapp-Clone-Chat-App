package com.example.basicChatApp;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.List;

@Component
public class WebSocketEventListener {

    private final OnlineUserService onlineUserService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepo messageRepo;
    private final ActiveChatService activeChatService;

    public WebSocketEventListener(OnlineUserService onlineUserService,
                                  SimpMessagingTemplate messagingTemplate,
                                  MessageRepo messageRepo,
                                  ActiveChatService activeChatService) {
        this.onlineUserService = onlineUserService;
        this.messagingTemplate = messagingTemplate;
        this.messageRepo = messageRepo;
        this.activeChatService = activeChatService;
    }

    @EventListener
    @Transactional
    public void handleConnect(SessionConnectEvent event) {

        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(event.getMessage());

        Principal user = accessor.getUser();

        if (user != null) {
            String username = user.getName();

            onlineUserService.userOnline(username);
            List<Message> undelivered =
                    messageRepo.findByReceiverAndStatus(username, "SENT");

            for (Message m : undelivered) {
                m.setStatus("DELIVERED");
            }

            messageRepo.saveAll(undelivered);

            // notify
            for (Message m : undelivered) {
                messagingTemplate.convertAndSend(
                        "/topic/status/" + m.getRoomId(),
                        m
                );
            }

            messagingTemplate.convertAndSend(
                    "/topic/online",
                    onlineUserService.getOnlineUsers()
            );
        }
    }
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(event.getMessage());

        Principal user = accessor.getUser();

        if (user != null) {
            String username = user.getName();

            System.out.println("🔴 DISCONNECT: " + username);

            onlineUserService.userOffline(username);
            activeChatService.clearActiveChat(username);
            messagingTemplate.convertAndSend(
                    "/topic/online",
                    onlineUserService.getOnlineUsers()
            );
        }
    }
}