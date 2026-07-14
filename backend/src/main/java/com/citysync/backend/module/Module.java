package com.citysync.backend.module;

import com.citysync.backend.coursework.Coursework;
import com.citysync.backend.user.User;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modules")
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //mmodules belong to one user
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id") //creates a user_id column in modules table
    private User user;

    @Column(nullable = false)
    private String code; //like module num IN3007

    @Column(nullable = false)
    private String name; // like Cloud

    private Integer credits;//optional

    //if module is deleted, delete its coursework too
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Coursework> courseworkItems = new ArrayList<>();

    public Module() {}

    public Module(User user, String code, String name, Integer credits) {
        this.user = user;
        this.code = code;
        this.name = name;
        this.credits = credits;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public Integer getCredits() { return credits; }

    public void setUser(User user) { this.user = user; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setCredits(Integer credits) { this.credits = credits; }
}