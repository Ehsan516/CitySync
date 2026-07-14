package com.citysync.backend.module;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, Long> {//jpa repo for module entity
    List<Module> findByUserId(Long userId);//retries all modules belonging to a specific user
}
