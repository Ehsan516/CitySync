package com.citysync.backend.user;

import jakarta.persistence.*;
import java.time.Instant;//for timestamp

@Entity
@Table(name = "users")
public class User {

    @Id//primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) //postgres autogenerate ID
    private Long id;

    @Column(nullable = false, unique = true)//nullable=false for db not null
    //^unique=true so no same email
    private String email;

    @Column(nullable = false)
    //store when user record was created
    private Instant createdAt = Instant.now();//default value set on object creation

    public User() {}

    public User(String email) {
        this.email = email;
    }

    //getters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public Instant getCreatedAt() { return createdAt; }

    //setter for email
    public void setEmail(String email) { this.email = email; }
}
