package com.citysync.backend.coursework;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CwRepo extends JpaRepository<Coursework, Long> {

    //fdetch all coursework for a user with module to user rel
    List<Coursework> findByModuleUserId(Long userId);

    List<Coursework> findByModuleId(Long moduleId); //fetch coursework for 1 module
}
