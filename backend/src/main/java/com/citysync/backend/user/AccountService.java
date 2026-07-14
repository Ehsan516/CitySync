package com.citysync.backend.user;

import com.citysync.backend.auth.AuthService;
import com.citysync.backend.auth.AuthCodeRepo;
import com.citysync.backend.module.ModuleRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final UserRepo userRepo;
    private final UserPrefRepo userPrefRepo;
    private final ModuleRepository moduleRepo;
    private final AuthCodeRepo authCodeRepo;
    private final AuthService authService;

    public AccountService(
            UserRepo userRepo,
            UserPrefRepo userPrefRepo,
            ModuleRepository moduleRepo,
            AuthCodeRepo authCodeRepo,
            AuthService authService
            //all the repos and servcies for the call

    ){
        //constructor initiali
        this.userRepo = userRepo;
        this.userPrefRepo = userPrefRepo;
        this.moduleRepo = moduleRepo;
        this.authCodeRepo = authCodeRepo;
        this.authService = authService;

    }

    @Transactional
    public void delAccount(Long userId,String code ,Authentication auth){
    //sending delete account codr to current authenticated suer email

        Long authUserId = takeAuthUserId(auth);//gets user id from auth object

        if(!userId.equals(authUserId)){
            throw new IllegalArgumentException("Wrong user ID");//message so only user can dleete own account
        }

        User user = userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("User isn't found"));
        //gets the user from the db^

        if(code == null || code.isBlank()){
            throw new IllegalArgumentException("Delete code is required");
        }

        authService.deleteAccCode(user.getEmail(), code.trim());//verify the delete code matches

        userPrefRepo.deleteById(userId);//prefs are deleted

        moduleRepo.deleteAll(moduleRepo.findByUserId(userId));//deletes modules which aslo deletes coureswork
        authCodeRepo.deleteByEmail(user.getEmail());//deletes all auth codes from email

        userRepo.delete(user);//deletes the row itself

    }

    private Long takeAuthUserId(Authentication auth){//helper to get auth user id

        if (auth == null || auth.getPrincipal() == null){
            throw new IllegalArgumentException("unahtenticated request");}
            Object principle = auth.getPrincipal();//whatever is stored as principle

            if (principle instanceof Long userId){
                return userId;//returns if long
            }

            if (principle instanceof Number n) {
                return n.longValue();//returns even if integer
            }

            throw new IllegalArgumentException("invalid auth principle");
            //else reject^
        }

    public void reqDeleteCode(Long userId, Authentication auth) {

        Long authUserId = takeAuthUserId(auth);

        //user can only request code for them
        if (!userId.equals(authUserId)) {
            throw new IllegalArgumentException("Wrong user ID");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        //send delete account code
        authService.requestDeleteAccountCode(user.getEmail());
    }

}

