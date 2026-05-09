package com.example.basicChatApp;

import org.springframework.stereotype.Service;

import java.util.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;


@Service
public class MessageService {
    private final MessageRepo repo;
    public MessageService(MessageRepo repo){
        this.repo = repo;
    }
    public Message saveMessage(Message msg){

        return repo.save(msg);
    }
    public List<Message> getAllMessage(){
        return repo.findAll();
    }
    public List<Message> getMessagesByRoom(String roomId){
        return repo.findByRoomId(roomId);
    }
    public List<LastMessageDTO> getLastMessages(String username) {

        List<Message> messages = repo.findMessagesForUser(username);

        Map<String, Message> latestPerRoom = new HashMap<>();

        // pick latest message per room
        for (Message m : messages) {
            if (!latestPerRoom.containsKey(m.getRoomId())) {
                latestPerRoom.put(m.getRoomId(), m);
            }
        }

        List<LastMessageDTO> result = new ArrayList<>();

        for (Message m : latestPerRoom.values()) {

            String[] users = m.getRoomId().split("_");

            String contact = users[0].equals(username)
                    ? users[1]
                    : users[0];

            result.add(new LastMessageDTO(
                    contact,
                    m.getContent(),
                    m.getTimestamp()
            ));
        }

        return result;
    }
    public Map<String, Integer> getUnread(String username) {
        List<Object[]> result = repo.getUnreadCounts(username);

        Map<String, Integer> map = new HashMap<>();

        for (Object[] row : result) {
            String sender = (String) row[0];
            Long count = (Long) row[1];

            map.put(sender, count.intValue());
        }

        return map;
    }
    public Page<Message> getMessagesPaginated(String roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repo.getMessages(roomId, pageable);
    }
}
