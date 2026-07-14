package com.citysync.backend.coursework;

import com.citysync.backend.module.Module;
import com.citysync.backend.module.ModuleRepository;
import com.citysync.backend.user.UserRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;

@RestController
public class CwController {

    private final UserRepo userRepo;
    private final ModuleRepository moduleRepo;
    private final CwRepo cwRepo;

    private static final String defaultUniLoc="City St George's, University of London, Northampton Square, London EC1V 0HB";

    public CwController(UserRepo userRepo, ModuleRepository moduleRepo, CwRepo cwRepo) {
        this.userRepo = userRepo;
        this.moduleRepo = moduleRepo;
        this.cwRepo = cwRepo;
    }

    /** get /users/{userId}/coursework
     * lists all coursework for a user across all modules */
    @GetMapping("/users/{userId}/coursework")
    public ResponseEntity<java.util.List<CourseworkResponse>> listForUser(@PathVariable Long userId) {

        if (!userRepo.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        var items = cwRepo.findByModuleUserId(userId)
                .stream()
                .map(CourseworkResponse::from)
                .toList();

        return ResponseEntity.ok(items);
    }


    /** post/users/{ userId}/modules/{moduleId}/coursework
     * creates coursework under specific module for user*/
    @PostMapping("/users/{userId}/modules/{moduleId}/coursework")
    public ResponseEntity<?> create(
            @PathVariable Long userId,
            @PathVariable Long moduleId,
            @RequestBody CreateCourseworkReq req
    ) {

        if (!userRepo.existsById(userId)) {//checks user exists
            return ResponseEntity.notFound().build();
        }

        Module module = moduleRepo.findById(moduleId).orElse(null);
        if (module == null || !module.getUser().getId().equals(userId)) {//ensure module exists and belongs to user
            return ResponseEntity.notFound().build();
        }

        if (req.title() == null || req.title().isBlank() || req.dueDate() == null) {//validate request body (title + dueDate )
            return ResponseEntity.badRequest().build();
        }


        if(req.weighting() != null && (req.weighting() < 0 ||req.weighting() > 100)){
            return ResponseEntity.badRequest().body("Weighting must be betweenn 0 and 100 ;(");
        }

        if (excWeightLim(moduleId, req.weighting(), null)){
            return ResponseEntity.badRequest().body("Total coursework weighting for this module cant exceed 100");
        }

        String finalLocation = req.location();

        if (Boolean.TRUE.equals(req.onSite()) && (finalLocation ==null || finalLocation.isBlank())){
            finalLocation=defaultUniLoc;//if user doesnt enter location then defaults to uni campus
        }

        //save coursework linked to the module
        Coursework cw = new Coursework(module, req.title(), req.dueDate(), req.weighting());

        cw.setOnSite(req.onSite()!= null ? req.onSite(): false);
        cw.setLocation(req.location());

        Coursework saved = cwRepo.save(cw);
        return ResponseEntity.ok(CourseworkResponse.from(saved));//return DTO response
    }


    /**updates coursework under a specifc module for the user*/
    @PutMapping("/users/{userId}/modules/{moduleId}/coursework/{courseworkId}")
    public ResponseEntity<?> update(
            @PathVariable Long userId,
            @PathVariable Long moduleId,
            @PathVariable Long courseworkId,
            @RequestBody UpdateCourseworkReq req
    ) {
        //check user exists
        if (!userRepo.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        //check module exists and belongs to user
        Module module = moduleRepo.findById(moduleId).orElse(null);
        if (module == null || !module.getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        //check cw exists
        Coursework cw = cwRepo.findById(courseworkId).orElse(null);
        if (cw == null) {
            return ResponseEntity.notFound().build();
        }

        //check cw belongs to the same module
        if (!cw.getModule().getId().equals(moduleId)) {
            return ResponseEntity.notFound().build();
        }

        //check and apply updates
        if (req.title() != null) {
            if (req.title().isBlank()) return ResponseEntity.badRequest().build();
            cw.setTitle(req.title());
        }
        if (req.dueDate() != null) {
            cw.setDueDate(req.dueDate());
        }

        Integer nextWeight = req.weighting() != null ? req.weighting():cw.getWeighting();

        if (nextWeight != null && (nextWeight < 0 || nextWeight > 100)){
            return ResponseEntity.badRequest().body(java.util.Map.of("error","weighting must be between 0 and 100"));
        }

        if(excWeightLim(moduleId, nextWeight, courseworkId)){
            return ResponseEntity.badRequest().body(java.util.Map.of("error","total module weighting cant exceed 100"));
        }

        if (req.weighting() != null) {
            cw.setWeighting(req.weighting());
        }

        if (req.scorePercent()!= null){
            cw.setScorePercent(req.scorePercent());
        }

        if(req.onSite() != null){
            cw.setOnSite(req.onSite());//update whether cw is on-site event

            if(!req.onSite()){
                cw.setLocation(null);//switched off clears saved location
            }
        }

        if(req.location() != null){
            cw.setLocation(req.location());
            //only updates location when value is provided
        }
        if(cw.isOnSite() && (cw.getLocation() == null || cw.getLocation().isBlank())){
            cw.setLocation(defaultUniLoc);
        }

        if (req.completed() != null) {
            cw.setCompleted(req.completed());//completion toggle
        }

        Coursework saved = cwRepo.save(cw);
        return ResponseEntity.ok(CourseworkResponse.from(saved));
    }


    /**deletes coursework under a specific module for the user */
    @DeleteMapping("/users/{userId}/modules/{moduleId}/coursework/{courseworkId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long userId,
            @PathVariable Long moduleId,
            @PathVariable Long courseworkId
    ) {
        //check user exists
        if (!userRepo.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        //check module exists and belongs to this user
        Module module = moduleRepo.findById(moduleId).orElse(null);
        if (module == null || !module.getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        //sweing if cw exists and belongs to module
        Coursework cw = cwRepo.findById(courseworkId).orElse(null);
        if (cw == null || !cw.getModule().getId().equals(moduleId)) {
            return ResponseEntity.notFound().build();
        }

        cwRepo.delete(cw);
        return ResponseEntity.noContent().build();
    }

    private boolean excWeightLim(Long moduleId, Integer newWeight, Long cwIdExlude){
        if(newWeight == null) return false;//if no weighting like pas/fail, doesn't contribute

        int currentTotal = cwRepo.findByModuleId(moduleId).stream() //get all cw for module for current total weighting
                .filter(cw -> cwIdExlude == null || !cw.getId().equals(cwIdExlude))//so cw doesn't get updates for edits
                .map(Coursework::getWeighting) //only weighting form cw
                .filter(java.util.Objects::nonNull) //ignore ones with no weighting like pass fail ones

                .reduce(0,Integer::sum);//adds it up from 0

        return currentTotal + newWeight > 100;//check if new weighting > 100
    };


}

//request body JSON for create coursework
record CreateCourseworkReq(String title, LocalDateTime dueDate, Integer weighting, Boolean onSite, String location) {}

record UpdateCourseworkReq(String title, LocalDateTime dueDate, Integer weighting, Boolean completed,
                           java.math.BigDecimal scorePercent, Boolean onSite, String location) {}

/**
 * response DTO returned to the client
 * keeps response small by not returning full module/user objects*/
record CourseworkResponse(
        Long id, Long moduleId, Long userId, String title, LocalDateTime dueDate,
        Integer weighting, Boolean completed, Instant completedAt, java.math.BigDecimal scorePercent,
        Boolean onSite, String location
) {
    static CourseworkResponse from(Coursework c) {
        return new CourseworkResponse(

                c.getId(),c.getModule().getId(),
                c.getModule().getUser().getId(),
                c.getTitle(),c.getDueDate(),
                c.getWeighting(),c.isCompleted(),
                c.getCompletedAt(),c.getScorePercent(),
                c.isOnSite(), c.getLocation()
        );
    }
}