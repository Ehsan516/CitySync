package com.citysync.backend.travel;

import java.time.Instant;
import java.util.List;

public record TravelPlanDto(

    boolean fallback,

    String mode,
    boolean arriveBy,

    Instant requestedTime,
    Instant computedAt,

    List<RouteOptionDto> options,

    String notice
){
    static TravelPlanDto failed(String mode, boolean arriveBy, Instant requestedTime, String notice) {
        return new TravelPlanDto(true, mode, arriveBy, requestedTime, Instant.now(), List.of(), notice);
    }
}
