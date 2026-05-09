package com.example.basicChatApp;

import com.example.basicChatApp.security.JwtUtil;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Service;

import java.security.Principal;


@Service
public class UserChannelInterceptor implements ChannelInterceptor {

    private final OnlineUserService onlineUserService;
    private final JwtUtil jwtUtil;

    public UserChannelInterceptor(OnlineUserService onlineUserService, JwtUtil jwtUtil) {
        this.onlineUserService = onlineUserService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        // CONNECT
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader =
                    accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {

                String token = authHeader.substring(7);

                String username =
                        jwtUtil.extractUsername(token);

                System.out.println("🟢 CONNECT: " + username);

                accessor.setUser(() -> username);

                onlineUserService.userOnline(username);
            }
        }

        // DISCONNECT
        if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {

            Principal user = accessor.getUser();

            if (user != null) {
                System.out.println("🔴 DISCONNECT: " + user.getName());
                onlineUserService.userOffline(user.getName());
            }
        }

        return message;
    }
}