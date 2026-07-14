package com.citysync.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPrefRepo extends JpaRepository<UserPref, Long> {}
//^crud repo for user pref by userId