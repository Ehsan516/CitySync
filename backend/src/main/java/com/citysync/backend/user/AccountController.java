package com.citysync.backend.user;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
@RestController
@RequestMapping("/users")
public class AccountController {

    private final AccountService accountService; //object in service layer for delete coount logic

    public AccountController(AccountService accountService){
        this.accountService = accountService; //account service constructor
    }

    @PostMapping("/{id}/delete-account/request-code")
    //endpoint to send a verification code to logged in user email when deleting account

    public ResponseEntity<?> requestDeleteCode(@PathVariable Long id, Authentication auth){

        try{
            accountService.reqDeleteCode(id,auth);
            return ResponseEntity.ok(Map.of("message","Delete code sent to your email."));
        }catch (IllegalArgumentException e){
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e){

            return ResponseEntity.internalServerError().body(Map.of("error","failed to send delete code"));
        }

    }


    @DeleteMapping("/{id}")
    //endpoint verifies the delete code then deletes the account data
    public ResponseEntity<?> delAccount(
            @PathVariable Long id,//gets user id from the URL
            @RequestBody DeleteAccountRequest req, //json req body into simple record obj
            Authentication auth
    ) {
        try {

            accountService.delAccount(id, req.code(), auth);//service layer for validate code,account delete

            return ResponseEntity.ok(Map.of("message", "Account deleted."));
            //success msg if everything worked
        } catch (IllegalArgumentException e) {
            //validation error
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            //anything else
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete account."));
        }
    }
record DeleteAccountRequest(String code){}
}
