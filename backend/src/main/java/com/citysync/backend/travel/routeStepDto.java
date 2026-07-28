package com.citysync.backend.travel;

import java.time.Instant;

public record routeStepDto ( //shows a step in a journey like train or walk
    String mode, //mode of transpot
    String instruction, //instructions in ui
    Integer durationSeconds,//duraiton of travel step in sec
    String departureStop,//where travel mode starts like train
    String arrivalStop,//where travel mode ends
    String lineName,//brighton train, rainham etc (the ones I take )
    String vehicleType,//train bus
    String headSign, //direction like "Farringdon"

    //the clock times are what make the live departure board possible, without these
    //the app can only say "38 mins" and not "the 14:02 train"
    Instant departureTime,//when this leg actually leaves
    Instant arrivalTime,//when this leg actually arrives
    Integer stopCount,//how many stops youre on for
    String lineColor,//line brand colour so ui can tint the badge
    String lineTextColor,//readable text colour on top of lineColor
    String agencyName //eg thameslink, tfl
){}
