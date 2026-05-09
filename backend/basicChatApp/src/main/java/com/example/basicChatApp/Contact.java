package com.example.basicChatApp;
import jakarta.persistence.*;
@Entity
@Table(
        name = "contact",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"owner", "contact_name"}
        )
)
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String owner;   // logged-in user

    @Column(name = "contact_name")
    private String contactName;

    public Contact() {}

    public Contact(String owner, String contactName) {
        this.owner = owner;
        this.contactName = contactName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }
}
