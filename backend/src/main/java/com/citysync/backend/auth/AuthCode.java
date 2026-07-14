package com.citysync.backend.auth;

import jakarta.persistence.*;
import java.time.Instant;

/**stores temporary digit verif code for a given email
 * 1 row per email, upserted on each new req so old codes replaced*/
@Entity
@Table(name = "auth_codes")
@IdClass(AuthCodeId.class)
public class AuthCode {

    @Id
    @Column(nullable = false)
    private String email;

    @Id
    @Column(nullable = false)
    private String purpose;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private Instant expiresAt;

    public AuthCode() {}

    public AuthCode(String email, String purpose, String code, Instant expiresAt) {

        this.email     = email;
        this.purpose = purpose;
        this.code      = code;
        this.expiresAt = expiresAt;
    }

    //getters for auth codes
    public String  getEmail(){ return email; }
    public String getPurpose(){return purpose;}
    public String  getCode(){ return code; }
    public Instant getExpiresAt(){ return expiresAt; }
}
