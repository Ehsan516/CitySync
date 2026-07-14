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


}

//dto where seconds is travel time and fallback=true means the API failed :(
record TravelResponse(int seconds, boolean fallback) {}
