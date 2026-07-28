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

    /*these are deliberately not marked nullable=false. ddl-auto=update would emit
      "ALTER TABLE ADD COLUMN ... NOT NULL" which postgres rejects on a table that already has
      rows. the field initialisers below mean jpa never actually writes a null, and
      db/migration_travel_prefs.sql adds the real constraints for existing databases*/
    @Column(name = "preferred_mode")
    private String preferredMode = "TRANSIT";//default way the user travels

    @Column(name = "transit_modes")
    private String transitModes;//csv filter eg "TRAIN,SUBWAY", null means let google decide

    @Column(name = "transit_routing_pref")
    private String transitRoutingPref;//LESS_WALKING or FEWER_TRANSFERS

    @Column(name = "return_buffer_minutes")
    private int returnBufferMins = 0;//separate buffer for the trip home, usually less of a rush

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

    public String getPreferredMode() { return preferredMode; }//default travel mode
    public void setPreferredMode(String preferredMode) { this.preferredMode = preferredMode; }

    public String getTransitModes() { return transitModes; }//csv of allowed transit types
    public void setTransitModes(String transitModes) { this.transitModes = transitModes; }

    public String getTransitRoutingPref() { return transitRoutingPref; }//less walking vs fewer changes
    public void setTransitRoutingPref(String transitRoutingPref) { this.transitRoutingPref = transitRoutingPref; }

    public int getReturnBufferMins() { return returnBufferMins; }//buffer for the journey home
    public void setReturnBufferMins(int returnBufferMins) { this.returnBufferMins = returnBufferMins; }

//    public Instant getUpdatedAt() { return updatedAt; } //jut for debug
}