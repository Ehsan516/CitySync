package com.citysync.backend.auth;

import com.citysync.backend.user.User;
import com.citysync.backend.user.UserRepo;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.util.StringUtils;
import org.springframework.mail.MailException;
import jakarta.mail.internet.InternetAddress;

@Service
public class AuthService {

    public static final String purpLogin = "LOGIN";
    public static final String PurpDeleteAcc = "DELETE_ACCOUNT";

    private final AuthCodeRepo  codeRepo;
    private final UserRepo      userRepo;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddr;
    //to inject sender email form app properties for email verif from spring config
    private static final int CodeExprMins = 10;

    public AuthService(AuthCodeRepo codeRepo, UserRepo userRepo, JavaMailSender mailSender) {
        this.codeRepo   = codeRepo;
        this.userRepo   = userRepo;
        this.mailSender = mailSender;
    }

    /**generates  6 digit code, saves/replaces it in auth_codes and emails it
     * if email new, user row is also created so app has userId*/
    public void requestCode(String email) {
        validateEmail(email);

        // Create user row if first time
        if (!userRepo.existsByEmail(email)) {
            User u = new User();
            u.setEmail(email);
            userRepo.save(u);
        }

        saveSendCode(email, purpLogin, "Your CitySync login code");
    }

    /**verifies the code,returns the userId on success else throws failure*/
    @Transactional
    public long verifyCode(String email, String code) {

        AuthCode ac = codeRepo.findByEmailAndPurpose(email, purpLogin)
                .orElseThrow(() -> new IllegalArgumentException("No code requests for this email"));

        if (ac.getExpiresAt().isBefore(Instant.now())) {

            codeRepo.deleteByEmailAndPurpose(email, purpLogin);
            throw new IllegalArgumentException("Code expired.");
        }

        if (!ac.getCode().equals(code)) {
            throw new IllegalArgumentException("Invalid code.");
        }

        long userId = userRepo.findByEmail(email)//return the userId
                .orElseThrow(() -> new IllegalArgumentException("User not found.")).getId();

        //clean up used code
        codeRepo.deleteByEmailAndPurpose(email, purpLogin);

        return userId;
    }

    //send a delete account code to an existing user only
    public void requestDeleteAccountCode(String email) {
        validateEmail(email);

        if (!userRepo.existsByEmail(email)) {
            throw new IllegalArgumentException("User email not found.");
        }

        saveSendCode(email, PurpDeleteAcc, "Your CitySync delete account code");
    }

    //verify delete account code
    @Transactional
    public void deleteAccCode(String email, String code) {

        AuthCode ac = codeRepo.findByEmailAndPurpose(email, PurpDeleteAcc)
                .orElseThrow(() -> new IllegalArgumentException("No delete code requested"));

        if (ac.getExpiresAt().isBefore(Instant.now())) {

            codeRepo.deleteByEmailAndPurpose(email, PurpDeleteAcc);
            throw new IllegalArgumentException("Delete code expired! >:0");
        }

        if (!ac.getCode().equals(code)) {
            throw new IllegalArgumentException("Invalid delete code ;(");
        }

        //clean up used code
        codeRepo.deleteByEmailAndPurpose(email, PurpDeleteAcc);
    }

    //helper used by both login and delete-account flows
    private void saveSendCode(String email, String purpose, String subject) {

        //generate 6 digit code
        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));//zero-padded

        AuthCode ac = new AuthCode(
                email,
                purpose,
                code,
                Instant.now().plus(CodeExprMins, ChronoUnit.MINUTES)
        ); //upsert replace any existing for this email+purpose
        codeRepo.save(ac);


        //send email
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddr);
        msg.setTo(email);
        msg.setSubject(subject);
        msg.setText(

                "Hi!!,\n\n" +
                        "Your CitySync verification code is:\n\n" +
                        "    " + code + "\n\n" +
                        "This code expires in " + CodeExprMins + " minutes.\n\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "– CitySync"
        );
        try{
            mailSender.send(msg);
        }catch (MailException e){
            throw new IllegalArgumentException("couldn't send verification email");
        }
    }

    private void validateEmail(String email){
        if(!StringUtils.hasText(email)){
            throw new IllegalArgumentException("invalid email address");

        }

        try {
            InternetAddress addr = new InternetAddress(email);
            addr.validate();
        }catch (Exception e){

            throw new IllegalArgumentException("invalid email address");
        }
    }

    }
