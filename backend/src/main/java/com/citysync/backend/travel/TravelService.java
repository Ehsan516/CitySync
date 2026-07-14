package com.citysync.backend.travel;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TravelService {

    @Value("${google.routes.api-key}")
    private String apiKey;

    private final WebClient webClient;

    public TravelService(WebClient.Builder builder) {
        this.webClient = builder
                .baseUrl("https://routes.googleapis.com")
                .build();
    }

    /**returns travel duration in seconds between home and uni
     *use google routes API computeRouteMatrix transit + walking
     *falls back to -1 if api call fials so frontend can use user buffer alone
     */
    public int getTravelSeconds(String origin, String destination, String arrivalTime) {
        try {

            //request body as for routes API spec
            Map<String, Object> requestBody = new java.util.LinkedHashMap<>();

            requestBody.put("origins", List.of(Map.of("waypoint", Map.of("address", origin))));
            requestBody.put("destinations", List.of(Map.of("waypoint", Map.of("address", destination))));
            requestBody.put("travelMode", "TRANSIT");

            if (arrivalTime != null && !arrivalTime.isBlank()){
                requestBody.put("arrivalTime",arrivalTime);
            }

            //to computeRouteMatrix
            //the field mask for google response
            String responseBody = webClient.post()
                    .uri("/distanceMatrix/v2:computeRouteMatrix")
                    .header("Content-Type", "application/json")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", "originIndex,destinationIndex,duration,status")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) return -1;

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            //^first element is single origin to destination result
            JsonNode root = mapper.readTree(responseBody);

            JsonNode firstElement = root.isArray() ? root.get(0) : root;//rm returns an array of its elements
            if (firstElement == null) return -1;

            JsonNode statusNode = firstElement.get("status");//if not pk then fall back
            if (statusNode != null && !statusNode.isNull()) {

                String code = statusNode.path("code").asText("0");
                if (!"0".equals(code)) return -1;
            }

            //duration returned
            String durationStr = firstElement.path("duration").asText("");
            if (durationStr.isEmpty()) return -1;
            durationStr = durationStr.replace("s", "").trim();//strip s then parse
            return Integer.parseInt(durationStr);

        } catch (Exception e) {

            System.err.println("[TravelService] Routes API error: " + e.getMessage());//log and return -1 so frontend falls back to user buffer
            return -1;
        }
    }

    public travelDeets getTravelDetails(
            String origin,
            String destination, String arrivalTime
    ){
        try{
            //req body for routes api
        //linkedhahsmap for insertion order
        Map<String, Object> requestBody = new java.util.LinkedHashMap<>();

        //start end location for routes api
        requestBody.put("origin", Map.of("address", origin));
        requestBody.put("destination", Map.of("address", destination));

        requestBody.put("travelMode","TRANSIT");//travel mode for train, bus
        requestBody.put("computeAlternativeRoutes", false);//less api rreqs
        requestBody.put("languageCode","en-GB");
        requestBody.put("units","METRIC");

        if (arrivalTime != null && !arrivalTime.isBlank()){
            requestBody.put("arrivalTime",arrivalTime);
        }

        String fieldMask = String.join(",",
                "routes.duration",
                "routes.legs.steps.travelMode",
                "routes.legs.steps.staticDuration",
                "routes.legs.steps.navigationInstruction.instructions",//walk insturction
                "routes.legs.steps.transitDetails.stopDetails.departureStop.name",//start place
                "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",//end place
                "routes.legs.steps.transitDetails.headsign",//directions like "farringdon"
                "routes.legs.steps.transitDetails.transitLine.name",//line name
                "routes.legs.steps.transitDetails.transitLine.vehicle.type"//train bus

                );

        String responseBody = webClient.post()//post req to routes api
                .uri("/directions/v2:computeRoutes")
                .header("Content-Type", "application/json")
                .header("X-Goog-Api-Key", apiKey)//my api key
                .header("X-Goog-FieldMask", fieldMask)
                //response field limit so not overload on response lol
                .bodyValue(requestBody)
                .retrieve().bodyToMono(String.class).block();

        if (responseBody == null || responseBody.isBlank()) {
            return new travelDeets(true, null, "no route details ;(", List.of());
            //if response empty then fllback
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(responseBody);
        //json string into tree sturcture

        JsonNode route = root.path("routes").get(0);//only first route, no alt

        if(route == null || route.isMissingNode()){
            return new travelDeets(true, null, "no route found ;(", List.of());
            //fallback if no route found
        }

        Integer totalSecs = parseDuration(route.path("duration").asText(null));
        //parse total duration

        List<routeStepDto> steps = new ArrayList<>();//list to store each journey step

        JsonNode stepsNode = route.path("legs").get(0).path("steps");
        //^json routes to legs to steps

        for (JsonNode step : stepsNode) {//loop through each step

            String mode = step.path("travelMode").asText();//walk or transit

            String instruction = step.path("navigationInstruction")
                    .path("instructions").asText("");//mainly walk instructions from google

            Integer stepSeconds = parseDuration(
                    step.path("staticDuration").asText(null)//converting step duration
            );


            JsonNode transit = step.path("transitDetails");
            //transit specific info

            //ggeting departure and arrival stop name
            String departure = text(transit.path("stopDetails")
                    .path("departureStop").path("name"));
            String arrival = text(transit.path("stopDetails")
                    .path("arrivalStop").path("name"));

            String headsign = text(transit.path("headsign"));//direction

            String line = text(transit.path("transitLine").path("name"));//like brighton train

            String vehicle = text(
                    transit.path("transitLine").path("vehicle").path("type")//vehicle type
            );

            String readable = buildInstruction(mode, instruction, departure, arrival, line, headsign);
            //string for user to read

            steps.add(new routeStepDto(
                    mode,readable,stepSeconds,departure,arrival,line,vehicle,headsign
                    //step in journey
            ));
        }
        String summary = buildSummary(steps);//short summary for ui

        return new travelDeets(false, totalSecs, summary, steps);
        //full response rturned
    } catch (Exception e){

        System.err.println("route detail eerror: " + e.getMessage());

        return new travelDeets(true, null, "route not available", List.of());
    }}

    private Integer parseDuration(String duration){
        if (duration ==null) return null;

        try{
            return Integer.parseInt(duration.replace("s",""));
            //removes s so i can pass int
        } catch (Exception e){
            return null;//if parsing fails
        }

    }

    private String text(JsonNode node){
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }

        String t = node.asText();//text value from node
        return (t == null || t.isBlank()) ? null : t;//if str empty then null
    }

    private String buildInstruction(
            String mode,String googleText,String dep,
            String arr,String line,String headsign
            //
    ) {
        if ("TRANSIT".equalsIgnoreCase(mode)) {//custom rwadable sentence

            StringBuilder sb = new StringBuilder("Take");

            if (line != null) sb.append(" ").append(line);
            if (headsign != null) sb.append(" toward ").append(headsign);
            if (dep != null) sb.append(" from ").append(dep);
            if (arr != null) sb.append(" to ").append(arr);

            return sb.toString();
        }

        if ("WALK".equalsIgnoreCase(mode)) {
            return googleText != null && !googleText.isBlank() ? googleText : "Walk";
            //walling step uses google instruction if available
        }

        return googleText;
    }

    // builds short summary like: walk to luton train station, take brighton train to farringdon"
    private String buildSummary(List<routeStepDto> steps) {

        for (routeStepDto step : steps) {

            if ("TRANSIT".equalsIgnoreCase(step.mode())) {
            //find first transt step
                StringBuilder sb = new StringBuilder();

                if (step.departureStop() != null) {
                    //walking part before transit
                    sb.append("Walk to ").append(step.departureStop());
                }

                if (step.lineName() != null) {//transit
                    sb.append(", take ").append(step.lineName());

                    if (step.headSign() != null) {
                        sb.append(" toward ").append(step.headSign());
                    }
                }

                return sb.toString();//first summary returned
            }
        }

        return "Route available";//falback if no tranit found
    }

}
