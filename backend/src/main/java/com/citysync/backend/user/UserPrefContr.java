package com.citysync.backend.user;

import com.citysync.backend.security.OwnershipCheck;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserPrefContr {

    private final UserPrefService prefsService;//validation goes to service layer
    private final OwnershipCheck ownershipCheck;

    public UserPrefContr(UserPrefService prefsService, OwnershipCheck ownershipCheck) {

        this.prefsService = prefsService;
        this.ownershipCheck = ownershipCheck;
    }

    @GetMapping("/{id}/preferences")//gets user saved settinsg from their id
    public ResponseEntity<UserPrefDto> get(@PathVariable Long id, Authentication auth) {

        if (!ownershipCheck.isSelf(id, auth)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(prefsService.get(id));//returns dto
    }

    @PutMapping("/{id}/preferences")//creat/update settings
    public ResponseEntity<UserPrefDto> put(@PathVariable Long id, @RequestBody UserPrefDto dto, Authentication auth) {
        if (!ownershipCheck.isSelf(id, auth)) {
            return ResponseEntity.status(403).build();
        }

        try {

            return ResponseEntity.ok(prefsService.upsert(id, dto));//updates and inserts and retruns saved state

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().build();//if invalid payload like invalid buffer
        }
    }
}