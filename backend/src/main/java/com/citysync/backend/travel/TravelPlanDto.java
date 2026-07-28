package com.citysync.backend.travel;

import java.time.Instant;
import java.util.List;

/**full travel plan response for the frontend*/
public record TravelPlanDto(

    boolean fallback,//true if the api failed so the app uses the users buffer alone

    String mode,//echoed back so the ui knows which mode these options belong to
    boolean arriveBy,//true if this was an arrive-by query, false means depart-at

    Instant requestedTime,//the arrival/departure time we asked google for
    Instant computedAt,//when this was calculated, drives the "updated 12s ago" stamp

    List<RouteOptionDto> options,

    String notice //non fatal caveat to show the user eg walking routes are beta
){
    //helper for the failure path so the callers dont repeat this
    static TravelPlanDto failed(String mode, boolean arriveBy, Instant requestedTime, String notice) {
        return new TravelPlanDto(true, mode, arriveBy, requestedTime, Instant.now(), List.of(), notice);
    }
}
