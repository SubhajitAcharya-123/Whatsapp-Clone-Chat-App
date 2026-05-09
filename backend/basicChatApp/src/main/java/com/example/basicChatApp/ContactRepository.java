package com.example.basicChatApp;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByOwner(String owner);
    boolean existsByOwnerAndContactName(String owner, String contactName);
}
