package com.citysync.backend.module;

import com.citysync.backend.user.User;
import com.citysync.backend.user.UserRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/{userId}/modules")
public class ModuleController{

    private final UserRepo userRepo;
    private final ModuleRepository moduleRepo;
    //gets the user and module table for creaion or fetching

    public ModuleController(UserRepo userRepo, ModuleRepository moduleRepo){
        //constructor with user and module table as args
        this.userRepo = userRepo;
        this.moduleRepo = moduleRepo;
    }

    /**creating a new module for a specific user */

    @PostMapping
    public ResponseEntity<ModuleResponse> create (
            @PathVariable Long userId, //takes user ID from URL
            @RequestBody CreateModuleReq req //the json body is mapped to a javarecord

    ){
        User user = userRepo.findById(userId).orElse(null);
        //check whether the parent user exists

        if(user == null){
            return ResponseEntity.notFound().build();//if the user does not exist return 404
        }


        if (req.code() == null || req.code().isBlank()|| req.name() == null || req.name().isBlank()) {
            return ResponseEntity.badRequest().build();    //prevents empty/kinda empty modules being saved
        }


        Module saved = moduleRepo.save( //create a new module entity and associate it with the user
            new Module(user, req.code(), req.name(), req.credits())
        );

        /** converts entity to DTO before returning
         * so it avoids returning full User object inside module*/
        return ResponseEntity.ok(ModuleResponse.from(saved));
    }

    /**list all modules for specific user
     * and HTTP: Get /users/{userId}/modules*/
    @GetMapping
    public ResponseEntity<List<ModuleResponse>> list(@PathVariable Long userId) {

        if (!userRepo.existsById(userId)) {
            return ResponseEntity.notFound().build(); //if user doesn't exist return 404
        }


        List<ModuleResponse> modules =  //ftechs modules that belong to this user
                moduleRepo.findByUserId(userId) //findByUserId generates SQL
                        .stream() //stream/map converts entities to dtos
                        .map(ModuleResponse::from)
                        .toList();//returns immutable list

        return ResponseEntity.ok(modules);
    }


    //update module
    @PutMapping("/{moduleId}")
    public ResponseEntity<ModuleResponse> update(
            @PathVariable Long userId,
            @PathVariable Long moduleId,
            @RequestBody UpdateModuleReq req
    ) {


        if (!userRepo.existsById(userId)) return ResponseEntity.notFound().build();

        Module m = moduleRepo.findById(moduleId).orElse(null);
        if (m == null || !m.getUser().getId().equals(userId))
            return ResponseEntity.notFound().build();
        if (req.code() != null) {
            if (req.code().isBlank()) return ResponseEntity.badRequest().build();
            m.setCode(req.code());
        }

        if (req.name() != null) {

            if (req.name().isBlank()) return ResponseEntity.badRequest().build();
            m.setName(req.name());
        }

        if (req.credits() != null) {
            m.setCredits(req.credits());
        }
        Module saved = moduleRepo.save(m);
        return ResponseEntity.ok(ModuleResponse.from(saved));
    }

    //delete module
    @DeleteMapping("/{moduleId}")
    public ResponseEntity<Void> delete(

            @PathVariable Long userId,
            @PathVariable Long moduleId

    ) {
        if (!userRepo.existsById(userId))
            return ResponseEntity.notFound().build();

        Module m = moduleRepo.findById(moduleId).orElse(null);
        if (m == null || !m.getUser().getId().equals(userId))
            return ResponseEntity.notFound().build();
        moduleRepo.delete(m);
        return ResponseEntity.noContent().build();
    }


}

//request body json for create:  {"code":"IN3001","name":"Cool Module","credits":15}
record CreateModuleReq(String code, String name, Integer credits) {}

record UpdateModuleReq(String code, String name, Integer credits) {}

record ModuleResponse(Long id, Long userId, String code, String name, Integer credits) {
    static ModuleResponse from(Module m) {
        return new ModuleResponse(//response DTO (prevent full User object inside Module)
                m.getId(),
                m.getUser().getId(),
                m.getCode(),
                m.getName(),
                m.getCredits()
        );
    }
}