package com.citysync.backend.travel;

import java.time.Instant;
import java.util.List;

public record RouteOptionDto(

    int optionIndex,

    Integer durationSeconds,
    String summary,

    Instant departureTime,
    Instant arrivalTime,

    Integer transferCount,
    Integer walkingSeconds,

    List<routeStepDto> steps
){}
