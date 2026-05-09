package com.example.basicChatApp;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ActiveChatService activeChatService;
    private final OnlineUserService onlineUserService;

    public ChatWebSocketController(
            MessageService messageService,
            SimpMessagingTemplate messagingTemplate,
            ActiveChatService activeChatService,
            OnlineUserService onlineUserService
    ) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
        this.activeChatService = activeChatService;
        this.onlineUserService = onlineUserService;
    }


//    @SendTo("/topic/messages/{roomId}")
@MessageMapping("/send/{roomId}")
public void send(@DestinationVariable String roomId,
                 Message message,
                 Principal principal) {

    String sender = principal.getName();
    message.setSender(sender);

    message.setRoomId(roomId);
    message.setTimestamp(LocalDateTime.now());

    String[] users = roomId.split("_");
    String receiver = sender.equals(users[0]) ? users[1] : users[0];
    message.setReceiver(receiver);   // ✅ set BEFORE save

    String activeRoom = activeChatService.getActiveChat(receiver);
    boolean isActive = activeRoom != null && roomId.equals(activeRoom);

    // ✅ set status BEFORE save
    if (isActive) {
        message.setStatus("SEEN");
    } else if (onlineUserService.getOnlineUsers().contains(receiver)) {
        message.setStatus("DELIVERED");
    } else {
        message.setStatus("SENT");
    }

    // ✅ NOW save (correct data goes to DB)
    Message saved = messageService.saveMessage(message);

    // ✅ send message
    messagingTemplate.convertAndSend("/topic/messages/" + roomId, saved);

    messagingTemplate.convertAndSendToUser(
            receiver,
            "/queue/messages",
            saved
    );

    // ✅ unread logic
//    if (!isActive) {
//        unreadService.increment(receiver, sender);
//    }
}
    @MessageMapping("/typing/{roomId}")
    public void typing(@DestinationVariable String roomId, Principal principal) {

        String sender = principal.getName();

        messagingTemplate.convertAndSend(
                "/topic/typing/" + roomId,
                sender
        );
    }
    @MessageMapping("/stopTyping/{roomId}")
    public void stopTyping(@DestinationVariable String roomId, Principal principal) {

        String sender = principal.getName();

        messagingTemplate.convertAndSend(
                "/topic/typing/" + roomId,
                ""
        );
    }
}
