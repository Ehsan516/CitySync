package com.citysync.backend.user;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserRepo repo;//depends on repo layer

    public UserController(UserRepo repo) {//constructor
        this.repo = repo;
    }
    @GetMapping //for /user to work
    public List<User> getAll(){
        return repo.findAll();
    }

    //POST for email format x@y.com
    @PostMapping
    public ResponseEntity<User> create (@RequestBody CreatedUserRequest req){

        if (req.email()==null || req.email().isBlank()){//check for blank emails
            return ResponseEntity.badRequest().build();
        }

        User saved  =repo.save((new User(req.email())));//saved tp db

        return ResponseEntity.created(URI.create("/users/" + saved.getId())).body(saved);//created and location header

    }

    //GET user id
    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id){
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); //checks if user id is found
    }


}
//DTO for the created user
record CreatedUserRequest(String email){}