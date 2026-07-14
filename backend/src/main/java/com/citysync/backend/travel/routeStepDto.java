package com.citysync.backend.travel;

public record routeStepDto ( //shows a step in a journey like train or walk
    String mode, //mode of transpot
    String instruction, //instructions in ui
    Integer durationSec,//duraiton of travel step in sec
    String departureStop,//where travel mode starts like train
    String arrivalStop,//where travel mode ends
    String lineName,//brighton train, rainham etc (the ones I take )
    String vehicleType,//train bus
    String headSign //direction like "Farringdon"
){}
