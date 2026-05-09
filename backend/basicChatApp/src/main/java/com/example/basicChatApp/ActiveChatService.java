package com.example.basicChatApp;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ActiveChatService {

    private final Map<String, String> activeChatMap = new HashMap<>();
    // username -> roomId

    public void setActiveChat(String username, String roomId) {
        activeChatMap.put(username, roomId);
    }

    public String getActiveChat(String username) {
        return activeChatMap.get(username);
    }
    public void clearActiveChat(String username) {
        activeChatMap.remove(username);
    }
}