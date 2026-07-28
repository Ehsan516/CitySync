package com.citysync.backend.user;

import java.util.List;

//should return to user app settings screen
public record UserPrefDto(
        String homeAddress,
        String UniLoc,
        Integer bufferMins,

        //travel preferences, transitModes is a list so the app never has to build csv itself
        String preferredMode,//TRANSIT/DRIVE/WALK/BICYCLE/TWO_WHEELER
        List<String> transitModes,//eg ["TRAIN","SUBWAY"], empty means no filter
        String transitRoutingPref,//LESS_WALKING or FEWER_TRANSFERS
        Integer returnBufferMins
) {}
