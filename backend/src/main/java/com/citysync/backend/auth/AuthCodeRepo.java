package com.citysync.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AuthCodeRepo extends JpaRepository<AuthCode, AuthCodeId> {
    //PK is email, findById for lookup
    Optional<AuthCode> findByEmailAndPurpose(String email, String purpose);

    void deleteByEmailAndPurpose(String email, String purpose);

    void deleteByEmail(String email);
}
