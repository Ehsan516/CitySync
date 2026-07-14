package com.citysync.backend.user;

import jakarta.persistence.*;
import java.time.Instant;

/** creating this so users indiividually can store their own preferences on the app*/

@Entity
@Table(name = "user_preferences")//stores user settings used by travel time and leave alerts
public class UserPref {

    @Id
    @Column(name = "user_id")//primary key
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)//one preference record
    @MapsId
    @JoinColumn(name = "user_id")//joining on fk on users.id
    private User user;

    @Column(name = "home_address")//home or start address but should be hone lol
    private String homeAddress;
    @Column(name = "cityUni_address")
    private String UniLoc;//city uni location
    @Column(name = "buffer_minutes", nullable = false)
    private int bufferMins = 0;//travel buffer
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;//time when it was changed

    protected UserPref() {}

    public UserPref(User user) {

        this.user = user;
        this.updatedAt = Instant.now();
        //links row to user and ensures key matchs
    }

    @PrePersist
    @PreUpdate
    void touchUpdatedAt() {//runs before row is first inserted or uopdated

        this.updatedAt = Instant.now();//does it automatically without manual
    }

    //getters and setters for DTOs
    public Long getUserId() { return userId; }//PK for repo lookups
    public User getUser() { return user; }

    public String getHomeAddress() { return homeAddress; }//home add for calc
    public void setHomeAddress(String homeAddress) { this.homeAddress = homeAddress; }//setting it

    public String getCityAddress() { return UniLoc; }//destination string which is uni for travel calc
    public void setCityAddress(String UniLoc) { this.UniLoc = UniLoc; }

    public int getBufferMins() { return bufferMins; }//the leave buffer in mins
    public void setBufferMins(int bufferMins) { this.bufferMins = bufferMins; }

//    public Instant getUpdatedAt() { return updatedAt; } //jut for debug
}