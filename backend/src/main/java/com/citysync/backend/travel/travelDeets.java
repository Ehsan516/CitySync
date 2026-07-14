package com.citysync.backend.travel;
import java.util.List;
public record travelDeets (
    //full response for frontend

    boolean fallback, //is true if api fails and returnd go to fallback
    Integer durationSec,//rpute time ins seconds
    String summary, //travel summary for user
    List<routeStepDto> steps

){}
