package com.citysync.backend.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    //sends 6 digit code to that email

    @PostMapping("/request-code")
    public ResponseEntity<?> requestCode(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        if (email == null || email.isBlank()) {

            return ResponseEntity.badRequest().body(Map.of("error", "email is required."));

        }
        try {

            authService.requestCode(email.trim().toLowerCase());
            return ResponseEntity.ok(Map.of("message", "Code sent to " + email));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()

                .body(Map.of("error", "Failed to send code: " + e.getMessage()));
        }
    }

    /**POST /auth/verify-code
     * body { "email": "eample@city.ac.uk", "code": "220000"}
     * returns { "userId": 3 } on success*/
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String code  = body.get("code");

        if (email == null || code == null) {

            return ResponseEntity.badRequest().body(Map.of("error", "email and code are required."));
        }
        try {

            long userId = authService.verifyCode(email.trim().toLowerCase(), code.trim());
            return ResponseEntity.ok(Map.of("userId", userId));
        } catch (IllegalArgumentException e) {

            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {

            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Verification failed: " + e.getMessage()));
        }
    }
}
