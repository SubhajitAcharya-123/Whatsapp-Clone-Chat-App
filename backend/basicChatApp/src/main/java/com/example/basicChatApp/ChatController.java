package com.example.basicChatApp;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;


@RestController
@CrossOrigin(origins="http://localhost:3000")
@RequestMapping("/api/chat")
public class ChatController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ActiveChatService activeChatService;
    private final OnlineUserService onlineUserService;
    private final MessageRepo messageRepo;
    public ChatController(MessageService messageService, SimpMessagingTemplate messagingTemplate, ActiveChatService activeChatService, OnlineUserService onlineUserService, MessageRepo messageRepo){
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
        this.activeChatService = activeChatService;
        this.onlineUserService = onlineUserService;
        this.messageRepo = messageRepo;
    }
    @PostMapping
    public Message send(@RequestBody Message msg){
        msg.setTimestamp(LocalDateTime.now());
        return messageService.saveMessage(msg);


    }
    @GetMapping
    public List<Message> getAll(){
        return messageService.getAllMessage();
    }
    @GetMapping("/{roomId}")
    public Page<Message> getMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return messageService.getMessagesPaginated(roomId, page, size);
    }
//    @PostMapping("/send/{roomId}")
//    public void send(@DestinationVariable String roomId, @Payload Message msg) {
//        System.out.println("MSG RECEIVED: " + msg.getSender() + " " + msg.getContent());
//        msg.setRoomId(roomId);
//        msg.setTimestamp(LocalDateTime.now());
//
//        String[] users = roomId.split("_");
//        String receiver = users[0].equals(msg.getSender()) ? users[1] : users[0];
//        msg.setReceiver(receiver);
//
//        // ✅ SET STATUS BEFORE SAVE
//        if (onlineUserService.getOnlineUsers().contains(receiver)) {
//            msg.setStatus("DELIVERED");
//        } else {
//            msg.setStatus("SENT");
//        }
//
//        Message saved = messageService.saveMessage(msg);
//
//        messagingTemplate.convertAndSend("/topic/messages/" + roomId, saved);
//
//        messagingTemplate.convertAndSendToUser(
//                receiver,
//                "/queue/messages",
//                saved
//        );
//    }
    @PostMapping("/delivered")
    public void markDelivered(@RequestBody Map<String, Long> body) {

        Long messageId = body.get("messageId");

        Message m = messageRepo.findById(messageId).orElseThrow();

        if (!"SEEN".equals(m.getStatus())) {
            m.setStatus("DELIVERED");
            messageRepo.save(m);

            messagingTemplate.convertAndSend(
                    "/topic/status/" + m.getRoomId(),
                    m
            );
        }
    }
    @GetMapping("/lastMessages")
    public List<LastMessageDTO> getLastMessages(HttpServletRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return messageService.getLastMessages(username);
    }
    @GetMapping("/unread")
    public Map<String, Integer> getUnread(HttpServletRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return messageService.getUnread(username);
    }
//    @PostMapping("unread/clear")
//    public void clearUnread(@RequestBody Map<String, String> body) {
//        unreadService.clear(body.get("username"), body.get("contact"));
//    }
@PostMapping("/active")
public void setActive(@RequestBody Map<String, String> body, HttpServletRequest request) {

    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    String roomId = body.get("roomId");

    activeChatService.setActiveChat(username, roomId);

    String[] users = roomId.split("_");
    String contact = users[0].equals(username) ? users[1] : users[0];

    // ✅ mark seen directly in DB
    messageRepo.markSeen(username, contact);

    // ✅ fetch only updated messages
    List<Message> updated = messageRepo.findByReceiverAndSenderAndStatus(
            username,
            contact,
            "SEEN"
    );

    // ✅ notify
    messagingTemplate.convertAndSend(
            "/topic/status/" + roomId,
            updated
    );
}
    @GetMapping("/online")
    public Set<String> getOnlineUsers() {
        return onlineUserService.getOnlineUsers();
    }
//    @GetMapping("/chat/{roomId}")
//    public List<Message> getMessages(@PathVariable String roomId) {
//        return messageService.getMessagesByRoom(roomId);
//    }

}
