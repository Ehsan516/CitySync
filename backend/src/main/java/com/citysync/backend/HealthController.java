package com.citysync.backend;

import org.springframework.web.bind.annotation.GetMapping; //to map GET reqs to method
import org.springframework.web.bind.annotation.RestController; //web controller to return data
@RestController //raw http response no templates
public class HealthController {

    @GetMapping("/health")
    public String health(){
        return "backend is running fine (hopefully lol)";
    }
}
