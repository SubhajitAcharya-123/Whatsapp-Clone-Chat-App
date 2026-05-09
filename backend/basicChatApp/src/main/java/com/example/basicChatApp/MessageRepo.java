package com.example.basicChatApp;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MessageRepo extends JpaRepository<Message, Long> {
    List<Message> findByRoomId(String roomId);
    List<Message> findByReceiverAndStatus(String username, String status);
    List<Message> findByReceiverAndSender(String username, String contact);
    List<Message> findByRoomIdOrderByTimestampAsc(String roomId);
    @Modifying
    @Transactional
    @Query("""
    UPDATE Message m
    SET m.status = 'SEEN'
    WHERE m.receiver = :username
    AND m.sender = :contact
    AND m.status <> 'SEEN'
    """)
    void markSeen(@Param("username") String username, @Param("contact") String contact);

    @Query("SELECT m FROM Message m WHERE m.roomId LIKE %:username% ORDER BY m.timestamp DESC")
    List<Message> findMessagesForUser(@Param("username") String username);

    @Query("""
    SELECT m.sender, COUNT(m)
    FROM Message m
    WHERE m.receiver = :username AND m.status <> 'SEEN'
    GROUP BY m.sender
    """)
    List<Object[]> countUnreadBySender(String username);

    List<Message> findByReceiverAndSenderAndStatus(String username, String sender, String seen);
    @Query("""
    SELECT m.sender, COUNT(m)
    FROM Message m
    WHERE m.receiver = :username AND m.status <> 'SEEN'
    GROUP BY m.sender
    """)
    List<Object[]> getUnreadCounts(@Param("username") String username);
    @Query("""
SELECT m FROM Message m
WHERE m.roomId = :roomId
ORDER BY m.timestamp DESC
""")
    Page<Message> getMessages(
            @Param("roomId") String roomId,
            Pageable pageable
    );
}
