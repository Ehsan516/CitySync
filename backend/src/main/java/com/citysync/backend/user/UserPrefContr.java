package com.citysync.backend.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserPrefContr {

    private final UserPrefService prefsService;//validation goes to service layer

    public UserPrefContr(UserPrefService prefsService) {

        this.prefsService = prefsService;
    }

    @GetMapping("/{id}/preferences")//gets user saved settinsg from their id
    public ResponseEntity<UserPrefDto> get(@PathVariable Long id) {

        return ResponseEntity.ok(prefsService.get(id));//returns dto
    }

    @PutMapping("/{id}/preferences")//creat/update settings
    public ResponseEntity<UserPrefDto> put(@PathVariable Long id, @RequestBody UserPrefDto dto) {
        try {

            return ResponseEntity.ok(prefsService.upsert(id, dto));//updates and inserts and retruns saved state

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().build();//if invalid payload like invalid buffer
        }
    }
}