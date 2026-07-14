package com.citysync.backend.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserPrefService {
    //used service for reeading and writing prefs

    //to validate user and load preferences
    private final UserRepo userRepository;
    private final UserPrefRepo prefsRepository;


    public UserPrefService(UserRepo userRepo, UserPrefRepo prefsRepo) {
        this.userRepository = userRepo;
        this.prefsRepository = prefsRepo;
        //^unjecting user repo and prefs
    }

    @Transactional(readOnly = true) //only for fetching
    public UserPrefDto get(Long userId) {

        return prefsRepository.findById(userId) //checks preferences
                .map(p -> new UserPrefDto(p.getHomeAddress(), p.getCityAddress(), p.getBufferMins())) //maps entity to dto
                .orElseGet(() -> new UserPrefDto(null, null, 0));//if it doesnt exist then load defaults

    }

    @Transactional
    public UserPrefDto upsert(Long userId, UserPrefDto dto) {

        if (dto == null) throw new IllegalArgumentException("body required");//rejects if missing

        int buffer = (dto.bufferMins() == null) ? 0 : dto.bufferMins();//default is 0 buffer isnt set
        if (buffer < 0 || buffer > 300) {//5 hour buffer lol
            throw new IllegalArgumentException("bufferMinutes must be between 0 and 300");
        }

        User user = userRepository.findById(userId)//checks if user exists
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        UserPref prefs = prefsRepository.findById(userId).orElseGet(() -> new UserPref(user));
        //^loads the prefs or creates new row bound to user

        prefs.setHomeAddress(trimToNull(dto.homeAddress()));
        prefs.setCityAddress(trimToNull(dto.UniLoc()));
        prefs.setBufferMins(buffer);
        //^normalising strings and triming white space

        UserPref saved = prefsRepository.save(prefs);//changes saved

        return new UserPrefDto(saved.getHomeAddress(), saved.getCityAddress(), saved.getBufferMins());//returns saved vals bacl
    }

    //helper to store address
    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();//removes spaces in front and end
        return t.isEmpty() ? null : t;//empty goes to null
    }
}