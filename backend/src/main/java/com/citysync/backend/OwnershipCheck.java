package com.citysync.backend;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class OwnershipCheck {

    public boolean isSelf(Long pathUserId, Authentication auth) {
        if (pathUserId == null || auth == null || auth.getPrincipal() == null) {
            return false;
        }

        Object principal = auth.getPrincipal();
        Long authUserId;

        if (principal instanceof Long l) {
            authUserId = l;
        } else if (principal instanceof Number n) {
            authUserId = n.longValue();
        } else {
            return false;
        }

        return pathUserId.equals(authUserId);
    }
}
