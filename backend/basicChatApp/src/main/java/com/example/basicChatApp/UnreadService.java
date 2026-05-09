package com.example.basicChatApp;
import org.springframework.stereotype.Service;

import java.util.*;
@Service
public class UnreadService {

    // user -> (contact -> count)
    private Map<String, Map<String, Integer>> unreadMap = new HashMap<>();

    public void increment(String receiver, String sender) {
        unreadMap
                .computeIfAbsent(receiver, k -> new HashMap<>())
                .merge(sender, 1, Integer::sum);
    }

    public Map<String, Integer> getUnread(String username) {
        return unreadMap.getOrDefault(username, new HashMap<>());
    }

    public void clear(String username, String contact) {
        Map<String, Integer> userMap = unreadMap.get(username);
        if (userMap != null) {
            userMap.put(contact, 0);
        }
    }
}
