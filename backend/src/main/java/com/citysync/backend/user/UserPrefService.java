package com.citysync.backend.user;

import com.citysync.backend.travel.TravelService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
                .map(UserPrefService::toDto) //maps entity to dto
                .orElseGet(() -> new UserPrefDto(null, null, 0, "TRANSIT", List.of(), null, 0));//if it doesnt exist then load defaults

    }

    @Transactional
    public UserPrefDto upsert(Long userId, UserPrefDto dto) {

        if (dto == null) throw new IllegalArgumentException("body required");//rejects if missing

        int buffer = (dto.bufferMins() == null) ? 0 : dto.bufferMins();//default is 0 buffer isnt set
        if (buffer < 0 || buffer > 300) {//5 hour buffer lol
            throw new IllegalArgumentException("bufferMinutes must be between 0 and 300");
        }

        int returnBuffer = (dto.returnBufferMins() == null) ? 0 : dto.returnBufferMins();
        if (returnBuffer < 0 || returnBuffer > 300) {
            throw new IllegalArgumentException("returnBufferMins must be between 0 and 300");
        }

        String preferredMode = TravelService.normaliseMode(dto.preferredMode());
        List<String> transitModes = TravelService.parseTransitModes(joinCsv(dto.transitModes()));
        String routingPref = TravelService.normaliseTransitRoutingPref(dto.transitRoutingPref());

        User user = userRepository.findById(userId)//checks if user exists
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        UserPref prefs = prefsRepository.findById(userId).orElseGet(() -> new UserPref(user));
        //^loads the prefs or creates new row bound to user

        prefs.setHomeAddress(trimToNull(dto.homeAddress()));
        prefs.setCityAddress(trimToNull(dto.UniLoc()));
        prefs.setBufferMins(buffer);
        //^normalising strings and triming white space

        prefs.setPreferredMode(preferredMode);
        prefs.setTransitModes(transitModes.isEmpty() ? null : String.join(",", transitModes));
        prefs.setTransitRoutingPref(routingPref);
        prefs.setReturnBufferMins(returnBuffer);

        UserPref saved = prefsRepository.save(prefs);//changes saved

        return toDto(saved);//returns saved vals bacl
    }

    private static UserPrefDto toDto(UserPref p) {
        return new UserPrefDto(
                p.getHomeAddress(),
                p.getCityAddress(),
                p.getBufferMins(),
                p.getPreferredMode() == null ? "TRANSIT" : p.getPreferredMode(),
                splitCsv(p.getTransitModes()),
                p.getTransitRoutingPref(),
                p.getReturnBufferMins()
        );
    }

    private static List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return List.of(csv.split(","));
    }

    private static String joinCsv(List<String> values) {
        if (values == null || values.isEmpty()) return null;
        return String.join(",", values);
    }

    //helper to store address
    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();//removes spaces in front and end
        return t.isEmpty() ? null : t;//empty goes to null
    }
}
