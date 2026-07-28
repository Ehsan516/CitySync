package com.citysync.backend.travel;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/travel")
public class TravelController {

    private final TravelService travelService;

    public TravelController(TravelService travelService) {
        this.travelService = travelService;
    }

    /**if the routes API fails then returns: {seconds: -1, fallback: true }
     *the app should detect fallback=true and use the users saved bufer only
     */


    @GetMapping
    public ResponseEntity<TravelResponse> getTravel(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) String arrivalTime
    ) {
        if (origin == null || origin.isBlank() || destination == null || destination.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        int seconds = travelService.getTravelSeconds(origin.trim(), destination.trim(), arrivalTime);
        boolean fallback = (seconds == -1);

        return ResponseEntity.ok(new TravelResponse(seconds, fallback));
    }

    @GetMapping("/details")
    public ResponseEntity<travelDeets> getTravelDetails(

        @RequestParam String origin,
        @RequestParam String destination,
        //^start and end location

        @RequestParam(required = false) String arrivalTime//arrival time optional
    ){

        if(origin == null || origin.isBlank() || destination == null || destination.isBlank()){
            //^validation so no bad reqs are sent
            return ResponseEntity.badRequest().build();
        }

        travelDeets details = travelService.getTravelDetails( origin.trim(), destination.trim(), arrivalTime);
        //service layer

        return ResponseEntity.ok(details);
        //json returned to frontend
    }

    /**full journey planner, returns several options so the app can show a departure board
     *
     * pass arrivalTime to plan "get me there by", or departureTime to plan "leaving at",
     * or neither for "leaving right now" which is what the live refresh uses
     */
    @GetMapping("/plan")
    public ResponseEntity<TravelPlanDto> getPlan(
            @RequestParam String origin,
            @RequestParam String destination,

            @RequestParam(required = false) String mode,//TRANSIT default, also DRIVE/WALK/BICYCLE/TWO_WHEELER

            @RequestParam(required = false) String departureTime,
            @RequestParam(required = false) String arrivalTime,

            @RequestParam(required = false) String transitModes,//csv eg TRAIN,SUBWAY
            @RequestParam(required = false) String transitRoutingPref,//LESS_WALKING or FEWER_TRANSFERS

            @RequestParam(required = false, defaultValue = "true") boolean alternatives
    ) {
        if (isBlank(origin) || isBlank(destination)) {
            return ResponseEntity.badRequest().build();
        }

        //google rejects both together, so fail here instead of burning an api call to find out
        if (!isBlank(departureTime) && !isBlank(arrivalTime)) {
            return ResponseEntity.badRequest().build();
        }

        TravelPlanDto plan = travelService.getPlan(
                origin.trim(), destination.trim(), mode,
                departureTime, arrivalTime,
                transitModes, transitRoutingPref,
                alternatives
        );

        return ResponseEntity.ok(plan);
    }

    /**the last service of the day that still gets the user home
     *
     * body is null when nothing is left today or the mode has no timetable, the app treats
     * that as "no more services" rather than an error
     */
    @GetMapping("/last-service")
    public ResponseEntity<RouteOptionDto> getLastService(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String transitModes,
            @RequestParam(required = false) String transitRoutingPref
    ) {
        if (isBlank(origin) || isBlank(destination)) {
            return ResponseEntity.badRequest().build();
        }

        RouteOptionDto last = travelService.getLastService(
                origin.trim(), destination.trim(), mode, transitModes, transitRoutingPref
        );

        //204 rather than 404, "there is no last train" is a valid answer not a missing resource
        if (last == null) return ResponseEntity.noContent().build();

        return ResponseEntity.ok(last);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}

//dto where seconds is travel time and fallback=true means the API failed :(
record TravelResponse(int seconds, boolean fallback) {}
