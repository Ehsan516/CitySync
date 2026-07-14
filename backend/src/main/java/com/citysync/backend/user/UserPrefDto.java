package com.citysync.backend.user;

//should return to user app settings screen
public record UserPrefDto(
        String homeAddress,
        String UniLoc,
        Integer bufferMins
) {}