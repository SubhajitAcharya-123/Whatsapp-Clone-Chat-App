package com.example.basicChatApp;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class UserHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   org.springframework.http.server.ServerHttpResponse response,
                                   org.springframework.web.socket.WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {

        if (request instanceof ServletServerHttpRequest servletRequest) {
            String username = servletRequest.getServletRequest().getParameter("username");
            attributes.put("username", username);
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               org.springframework.http.server.ServerHttpResponse response,
                               org.springframework.web.socket.WebSocketHandler wsHandler,
                               Exception exception) {
    }
}
