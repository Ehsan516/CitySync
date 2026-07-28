package com.citysync.backend.travel;

import java.time.Instant;
import java.util.List;

/**one journey option the user can pick
 * google can return up to 4 of these per request (1 main + 3 alternatives) so the app
 * can show a departure board instead of a single take-it-or-leave-it route*/
public record RouteOptionDto(

    int optionIndex,//0 is googles preferred route

    Integer durationSeconds,//total door to door time
    String summary,//short readable line for the collapsed card

    Instant departureTime,//when the user needs to be moving
    Instant arrivalTime,//when they actually get there, used for the on time/late verdict

    Integer transferCount,//number of changes, 0 means direct
    Integer walkingSeconds,//total walking so users can compare "less walking" options

    List<routeStepDto> steps
){}
