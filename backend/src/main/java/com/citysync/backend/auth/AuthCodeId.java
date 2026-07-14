package com.citysync.backend.auth;

import java.io.Serializable;
import java.util.Objects;

//comp key for authcode email +purpose
public class AuthCodeId implements Serializable {

    private String email;
    private String purpose;

    public AuthCodeId() {}//for jpa

    public AuthCodeId(String email, String purpose) {
        //constructure for creating key instances
        this.email = email;
        this.purpose = purpose;
    }

    @Override
    public boolean equals(Object o) {
        //same object ref
        if (this == o) return true;
        if (!(o instanceof AuthCodeId that)) return false;//checks same class
        return Objects.equals(email, that.email) && Objects.equals(purpose, that.purpose);//keys equal if both email/purpose match
    }

    @Override
    public int hashCode() {
        return Objects.hash(email, purpose);
    }
}