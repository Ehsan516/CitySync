package com.citysync.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {//for cCRUD
    boolean existsByEmail(String email);//generates email query from method name
    Optional<User> findByEmail(String email); //needed fr authservice
}
