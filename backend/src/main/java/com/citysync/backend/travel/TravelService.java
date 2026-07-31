package com.citysync.backend.travel;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TravelService {

    @Value("${google.routes.api-key}")
    private String apiKey;

    private final WebClient webClient;

    private final ObjectMapper mapper = new ObjectMapper();

    private static final ZoneId LOCAL_ZONE = ZoneId.of("Europe/London");

    static final Set<String> TRAVEL_MODES = Set.of("TRANSIT", "DRIVE", "WALK", "BICYCLE", "TWO_WHEELER");
    static final Set<String> TRANSIT_SUB_MODES = Set.of("BUS", "SUBWAY", "TRAIN", "LIGHT_RAIL", "RAIL");
    static final Set<String> TRANSIT_ROUTING_PREFS = Set.of("LESS_WALKING", "FEWER_TRANSFERS");

    private static final Set<String> ROUTING_PREF_MODES = Set.of("DRIVE", "TWO_WHEELER");

    private static final Set<String> BETA_MODES = Set.of("WALK", "BICYCLE", "TWO_WHEELER");

    private static final long PLAN_CACHE_TTL_MILLIS = 30_000;

    private record CacheEntry(TravelPlanDto plan, long storedAt) {}

    private final Map<String, CacheEntry> planCache = new ConcurrentHashMap<>();

    private record LastServiceResult(RouteOptionDto option) {}

    private final Map<String, LastServiceResult> lastServiceCache = new ConcurrentHashMap<>();

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
            Map<String, Object> requestBody = new LinkedHashMap<>();

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

        } catch (WebClientResponseException e) {

            System.err.println("[TravelService] Routes API error: " + e.getMessage() + " body=" + e.getResponseBodyAsString());
            return -1;
        } catch (Exception e) {

            System.err.println("[TravelService] Routes API error: " + e.getMessage());//log and return -1 so frontend falls back to user buffer
            return -1;
        }
    }

    public travelDeets getTravelDetails(String origin, String destination, String arrivalTime) {

        TravelPlanDto plan = getPlan(
                origin, destination, "TRANSIT",
                null, arrivalTime,
                null, null,
                false
        );

        if (plan.fallback() || plan.options().isEmpty()) {
            return new travelDeets(true, null, "route not available", List.of());
        }

        RouteOptionDto best = plan.options().get(0);
        return new travelDeets(false, best.durationSeconds(), best.summary(), best.steps());
    }

    public TravelPlanDto getPlan(
            String origin,
            String destination,
            String mode,
            String departureTime,
            String arrivalTime,
            String transitModesCsv,
            String transitRoutingPref,
            boolean alternatives
    ) {
        String travelMode = normaliseMode(mode);
        boolean isTransit = "TRANSIT".equals(travelMode);

        List<String> subModes = isTransit ? parseTransitModes(transitModesCsv) : List.of();
        String routingPref = isTransit ? normaliseTransitRoutingPref(transitRoutingPref) : null;

        String cacheKey = String.join("|",
                origin, destination, travelMode,
                String.valueOf(departureTime), String.valueOf(arrivalTime),
                String.join(",", subModes), String.valueOf(routingPref),
                String.valueOf(alternatives)
        );

        CacheEntry cached = planCache.get(cacheKey);
        if (cached != null && (System.currentTimeMillis() - cached.storedAt()) < PLAN_CACHE_TTL_MILLIS) {
            return cached.plan();
        }

        TravelPlanDto plan = callComputeRoutes(
                origin, destination, travelMode,
                departureTime, arrivalTime,
                subModes, routingPref, alternatives
        );

        if (!plan.fallback()) {
            planCache.put(cacheKey, new CacheEntry(plan, System.currentTimeMillis()));
        }

        return plan;
    }

    public RouteOptionDto getLastService(
            String origin,
            String destination,
            String mode,
            String transitModesCsv,
            String transitRoutingPref
    ) {
        String travelMode = normaliseMode(mode);

        if (!"TRANSIT".equals(travelMode)) return null;

        LocalDate today = LocalDate.now(LOCAL_ZONE);

        String cacheKey = String.join("|", origin, destination, travelMode,
                String.valueOf(transitModesCsv), String.valueOf(transitRoutingPref), today.toString());

        LastServiceResult cachedResult = lastServiceCache.get(cacheKey);
        if (cachedResult != null) return cachedResult.option();

        List<String> subModes = parseTransitModes(transitModesCsv);
        String routingPref = normaliseTransitRoutingPref(transitRoutingPref);

        final int MAX_PROBES = 6;
        int probes = 0;

        RouteOptionDto best = null;

        for (int hour : new int[]{23, 22, 21}) {
            if (probes >= MAX_PROBES) break;
            probes++;

            RouteOptionDto option = probeDeparture(
                    origin, destination, travelMode, subModes, routingPref,
                    ZonedDateTime.of(today, LocalTime.of(hour, 30), LOCAL_ZONE).toInstant()
            );

            if (isOnDate(option, today)) {
                best = option;
                break;
            }
        }

        while (best != null && probes < MAX_PROBES) {
            probes++;

            RouteOptionDto later = probeDeparture(
                    origin, destination, travelMode, subModes, routingPref,
                    best.departureTime().plusSeconds(60)
            );

            if (!isOnDate(later, today)) break;
            if (!later.departureTime().isAfter(best.departureTime())) break;

            best = later;
        }

        lastServiceCache.put(cacheKey, new LastServiceResult(best));
        return best;
    }

    private RouteOptionDto probeDeparture(
            String origin, String destination, String travelMode,
            List<String> subModes, String routingPref, Instant departAfter
    ) {
        TravelPlanDto plan = callComputeRoutes(
                origin, destination, travelMode,
                DateTimeFormatter.ISO_INSTANT.format(departAfter), null,
                subModes, routingPref, false
        );

        if (plan.fallback() || plan.options().isEmpty()) return null;
        return plan.options().get(0);
    }

    private boolean isOnDate(RouteOptionDto option, LocalDate date) {
        if (option == null || option.departureTime() == null) return false;
        return option.departureTime().atZone(LOCAL_ZONE).toLocalDate().equals(date);
    }

    private TravelPlanDto callComputeRoutes(
            String origin,
            String destination,
            String travelMode,
            String departureTime,
            String arrivalTime,
            List<String> subModes,
            String routingPref,
            boolean alternatives
    ) {
        boolean isTransit = "TRANSIT".equals(travelMode);
        boolean arriveBy = false;
        Instant requestedTime = null;
        String notice = null;

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("origin", Map.of("address", origin));
        requestBody.put("destination", Map.of("address", destination));
        requestBody.put("travelMode", travelMode);
        requestBody.put("computeAlternativeRoutes", alternatives);
        requestBody.put("languageCode", "en-GB");
        requestBody.put("regionCode", "GB");
        requestBody.put("units", "METRIC");

        if (arrivalTime != null && !arrivalTime.isBlank()) {
            arriveBy = true;
            requestedTime = parseInstant(arrivalTime);

            if (isTransit) {
                requestBody.put("arrivalTime", arrivalTime);
            } else {
                notice = "Google can't plan arrive-by journeys for " + friendlyMode(travelMode)
                        + ", so this shows how long the trip takes and CitySync works your leave time back from it.";
            }
        } else if (departureTime != null && !departureTime.isBlank()) {
            requestedTime = parseInstant(departureTime);
            requestBody.put("departureTime", departureTime);
        }
        if (ROUTING_PREF_MODES.contains(travelMode)) {
            requestBody.put("routingPreference", "TRAFFIC_AWARE");
        }

        if (isTransit && (!subModes.isEmpty() || routingPref != null)) {
            Map<String, Object> transitPrefs = new LinkedHashMap<>();
            if (!subModes.isEmpty()) transitPrefs.put("allowedTravelModes", subModes);
            if (routingPref != null) transitPrefs.put("routingPreference", routingPref);
            requestBody.put("transitPreferences", transitPrefs);
        }

        if (BETA_MODES.contains(travelMode)) {
            notice = appendNotice(notice, friendlyMode(travelMode)
                    + " routes are still beta from Google and may be missing paths, so check before you set off.");
        }

        String fieldMask = String.join(",",
                "routes.duration",
                "routes.legs.steps.travelMode",
                "routes.legs.steps.staticDuration",
                "routes.legs.steps.navigationInstruction.instructions",//walk insturction
                "routes.legs.steps.transitDetails"
        );

        try {
            String responseBody = webClient.post()
                    .uri("/directions/v2:computeRoutes")
                    .header("Content-Type", "application/json")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", fieldMask)
                    .bodyValue(requestBody)
                    .retrieve().bodyToMono(String.class).block();

            if (responseBody == null || responseBody.isBlank()) {
                return TravelPlanDto.failed(travelMode, arriveBy, requestedTime, "No route details returned.");
            }

            JsonNode root = mapper.readTree(responseBody);
            JsonNode routes = root.path("routes");

            if (!routes.isArray() || routes.isEmpty()) {
                return TravelPlanDto.failed(travelMode, arriveBy, requestedTime, "No route found for this journey.");
            }

            Instant defaultStart = (!arriveBy && requestedTime != null) ? requestedTime : Instant.now();

            List<RouteOptionDto> options = new ArrayList<>();

            for (int i = 0; i < routes.size(); i++) {
                RouteOptionDto option = parseRoute(routes.get(i), i, defaultStart, arriveBy, requestedTime);
                if (option != null) options.add(option);
            }

            if (options.isEmpty()) {
                return TravelPlanDto.failed(travelMode, arriveBy, requestedTime, "No usable route found.");
            }

            options.sort((a, b) -> {
                if (a.departureTime() == null || b.departureTime() == null) return 0;
                return a.departureTime().compareTo(b.departureTime());
            });

            return new TravelPlanDto(
                    false, travelMode, arriveBy, requestedTime, Instant.now(), options, notice
            );

        } catch (WebClientResponseException e) {
            System.err.println("[TravelService] plan error: " + e.getMessage() + " body=" + e.getResponseBodyAsString());
            return TravelPlanDto.failed(travelMode, arriveBy, requestedTime, "Route service unavailable.");
        } catch (Exception e) {
            System.err.println("[TravelService] plan error: " + e.getMessage());
            return TravelPlanDto.failed(travelMode, arriveBy, requestedTime, "Route service unavailable.");
        }
    }

    private RouteOptionDto parseRoute(
            JsonNode route, int index, Instant defaultStart, boolean arriveBy, Instant requestedTime
    ) {
        if (route == null || route.isMissingNode()) return null;

        Integer totalSecs = parseDuration(route.path("duration").asText(null));

        List<routeStepDto> steps = new ArrayList<>();

        JsonNode legs = route.path("legs");
        if (legs.isArray()) {
            for (JsonNode leg : legs) {
                for (JsonNode step : leg.path("steps")) {
                    steps.add(parseStep(step));
                }
            }
        }

        int walkingSeconds = 0;
        int transitStepCount = 0;

        int leadingWalkSeconds = 0;
        int trailingWalkSeconds = 0;

        Instant firstTransitDeparture = null;
        Instant lastTransitArrival = null;

        for (routeStepDto step : steps) {
            boolean isTransitStep = "TRANSIT".equalsIgnoreCase(step.mode());
            int stepSeconds = step.durationSeconds() == null ? 0 : step.durationSeconds();

            if (isTransitStep) {
                transitStepCount++;

                if (firstTransitDeparture == null && step.departureTime() != null) {
                    firstTransitDeparture = step.departureTime();
                }
                if (step.arrivalTime() != null) {
                    lastTransitArrival = step.arrivalTime();
                    trailingWalkSeconds = 0;
                }
            } else {
                walkingSeconds += stepSeconds;

                if (firstTransitDeparture == null) {
                    leadingWalkSeconds += stepSeconds;
                } else {
                    trailingWalkSeconds += stepSeconds;
                }
            }
        }

        Instant departureTime;
        Instant arrivalTime;

        if (firstTransitDeparture != null) {
            departureTime = firstTransitDeparture.minusSeconds(leadingWalkSeconds);
            arrivalTime = lastTransitArrival != null
                    ? lastTransitArrival.plusSeconds(trailingWalkSeconds)
                    : (totalSecs != null ? departureTime.plusSeconds(totalSecs) : null);

        } else if (arriveBy && requestedTime != null && totalSecs != null) {
            arrivalTime = requestedTime;
            departureTime = requestedTime.minusSeconds(totalSecs);

        } else {
            departureTime = defaultStart;
            arrivalTime = totalSecs != null ? defaultStart.plusSeconds(totalSecs) : null;
        }

        return new RouteOptionDto(
                index,
                totalSecs,
                buildSummary(steps),
                departureTime,
                arrivalTime,
                Math.max(0, transitStepCount - 1),
                walkingSeconds,
                steps
        );
    }

    private routeStepDto parseStep(JsonNode step) {
        String mode = step.path("travelMode").asText();//walk or transit

        String instruction = step.path("navigationInstruction")
                .path("instructions").asText("");//mainly walk instructions from google

        Integer stepSeconds = parseDuration(step.path("staticDuration").asText(null));

        JsonNode transit = step.path("transitDetails");//transit specific info
        JsonNode stopDetails = transit.path("stopDetails");

        //ggeting departure and arrival stop name
        String departure = text(stopDetails.path("departureStop").path("name"));
        String arrival = text(stopDetails.path("arrivalStop").path("name"));

        Instant departureTime = firstInstant(
                stopDetails.path("departureTime"), transit.path("departureTime"));
        Instant arrivalTime = firstInstant(
                stopDetails.path("arrivalTime"), transit.path("arrivalTime"));

        String headsign = text(transit.path("headsign"));//direction

        JsonNode line = transit.path("transitLine");

        String lineName = text(line.path("nameShort"));
        if (lineName == null) lineName = text(line.path("name"));

        String vehicle = text(line.path("vehicle").path("type"));//vehicle type
        String lineColor = text(line.path("color"));
        String lineTextColor = text(line.path("textColor"));

        String agencyName = null;
        JsonNode agencies = line.path("agencies");
        if (agencies.isArray() && !agencies.isEmpty()) {
            agencyName = text(agencies.get(0).path("name"));
        }

        Integer stopCount = transit.path("stopCount").isNumber()
                ? transit.path("stopCount").asInt() : null;

        String readable = buildInstruction(mode, instruction, departure, arrival, lineName, headsign);

        return new routeStepDto(
                mode, readable, stepSeconds,
                departure, arrival,
                lineName, vehicle, headsign,
                departureTime, arrivalTime, stopCount,
                lineColor, lineTextColor, agencyName
        );
    }

    public static String normaliseMode(String mode) {
        if (mode == null || mode.isBlank()) return "TRANSIT";
        String upper = mode.trim().toUpperCase();
        return TRAVEL_MODES.contains(upper) ? upper : "TRANSIT";
    }

    public static List<String> parseTransitModes(String csv) {
        if (csv == null || csv.isBlank()) return List.of();

        Set<String> out = new LinkedHashSet<>();

        for (String raw : csv.split(",")) {
            String value = raw.trim().toUpperCase();
            if (TRANSIT_SUB_MODES.contains(value)) out.add(value);
        }

        return List.copyOf(out);
    }

    public static String normaliseTransitRoutingPref(String pref) {
        if (pref == null || pref.isBlank()) return null;
        String upper = pref.trim().toUpperCase();
        return TRANSIT_ROUTING_PREFS.contains(upper) ? upper : null;
    }

    private static String friendlyMode(String mode) {
        return switch (mode) {
            case "WALK" -> "Walking";
            case "BICYCLE" -> "Cycling";
            case "DRIVE" -> "Driving";
            case "TWO_WHEELER" -> "Motorcycle";
            default -> "Transit";
        };
    }

    private static String appendNotice(String existing, String addition) {
        if (existing == null || existing.isBlank()) return addition;
        return existing + " " + addition;
    }

    private static Instant parseInstant(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Instant.parse(value);
        } catch (Exception e) {
            try {
                return ZonedDateTime.parse(value).toInstant();
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private Instant firstInstant(JsonNode... candidates) {
        for (JsonNode node : candidates) {
            String raw = text(node);
            if (raw == null) continue;

            Instant parsed = parseInstant(raw);
            if (parsed != null) return parsed;
        }
        return null;
    }

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
