package com.citysync.backend.user;

import java.util.List;

//should return to user app settings screen
public record UserPrefDto(
        String homeAddress,
        String UniLoc,
        Integer bufferMins,

        String preferredMode,
        List<String> transitModes,
        String transitRoutingPref,
        Integer returnBufferMins
) {}
