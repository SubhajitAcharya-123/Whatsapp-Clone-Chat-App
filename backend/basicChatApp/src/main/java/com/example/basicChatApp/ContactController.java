package com.example.basicChatApp;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/chat")
public class ContactController {

    private final ContactRepository contactRepository;

    public ContactController(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @PostMapping("/contacts")
    public ResponseEntity<?> addContact(@RequestBody Contact contact,
                                        HttpServletRequest request) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        contact.setOwner(username);
        if (contactRepository.existsByOwnerAndContactName(
                username,
                contact.getContactName()
        )) {
            return ResponseEntity
                    .badRequest()
                    .body("Contact already exists"); // 👈 important
        }

        contact.setOwner(username);

        Contact saved = contactRepository.save(contact);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/contacts")
    public List<Contact> getContacts(HttpServletRequest request) {
        String username =
                SecurityContextHolder.getContext().getAuthentication().getName();
        return contactRepository.findByOwner(username);
    }
}
