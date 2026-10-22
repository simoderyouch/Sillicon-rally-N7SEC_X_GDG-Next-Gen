package com.silliconrally.api.games.beacon_bounce;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.silliconrally.api.team.SessionTokenService;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;

/** Shared Redis-backed, one-attempt Beacon Bounce competition run for each team. */
@Service
public class BeaconBounceRunService {
  private static final String PREFIX = "sillicon-rally:beacon-bounce:run:";
  private static final Duration TTL = Duration.ofHours(12);
  private static final List<String> BEACONS = List.of("sun", "rose", "mint", "violet", "ember", "pearl", "lime", "plum", "apricot");
  private static final int[] LENGTHS = {3, 3, 4, 6, 7, 9};
  private static final int[] POINTS = {8, 10, 13, 16, 22, 31};

  private final StringRedisTemplate redis;
  private final ObjectMapper json;
  public BeaconBounceRunService(StringRedisTemplate redis, ObjectMapper json) { this.redis = redis; this.json = json; }

  public record StartResponse(String runId, List<List<String>> routes, int round, int securedScore, boolean failed, boolean complete) { }
  public record AttemptResponse(boolean correct, boolean roundCleared, boolean failed, boolean complete, int securedScore, int nextRound) { }
  private record Run(String id, List<List<String>> routes, int round, int step, int securedScore, boolean failed, boolean complete) { }

  public StartResponse start(UUID teamId) {
    String key = key(teamId);
    String existing = redis.opsForValue().get(key);
    if (existing != null) return response(read(existing));
    Run candidate = new Run(UUID.randomUUID().toString(), randomRoutes(), 0, 0, 0, false, false);
    Boolean created = redis.opsForValue().setIfAbsent(key, write(candidate), TTL);
    return response(Boolean.TRUE.equals(created) ? candidate : readRequired(redis.opsForValue().get(key)));
  }

  public AttemptResponse attempt(UUID teamId, String runId, int round, String beacon) {
    Run run = readRequired(redis.opsForValue().get(key(teamId)));
    if (!run.id().equals(runId)) throw new ResponseStatusException(BAD_REQUEST, "This run does not belong to the current team");
    if (run.failed() || run.complete()) throw new ResponseStatusException(CONFLICT, "This competition run has already ended");
    if (round != run.round()) throw new ResponseStatusException(BAD_REQUEST, "This is not the active round");
    List<String> route = run.routes().get(run.round());
    if (!BEACONS.contains(beacon)) throw new ResponseStatusException(BAD_REQUEST, "Unknown beacon");
    if (!route.get(run.step()).equals(beacon)) {
      Run failed = new Run(run.id(), run.routes(), run.round(), run.step(), run.securedScore(), true, false);
      save(teamId, failed);
      return new AttemptResponse(false, false, true, false, failed.securedScore(), failed.round());
    }

    int nextStep = run.step() + 1;
    if (nextStep < route.size()) {
      Run next = new Run(run.id(), run.routes(), run.round(), nextStep, run.securedScore(), false, false);
      save(teamId, next);
      return new AttemptResponse(true, false, false, false, next.securedScore(), next.round());
    }

    int securedScore = run.securedScore() + POINTS[run.round()];
    boolean complete = run.round() == LENGTHS.length - 1;
    Run next = new Run(run.id(), run.routes(), complete ? run.round() : run.round() + 1, 0, securedScore, false, complete);
    save(teamId, next);
    return new AttemptResponse(true, true, false, complete, securedScore, next.round());
  }

  /** Returns a score only once the team's single run has failed or completed. */
  public VerifiedResult verifiedResult(UUID teamId) {
    Run run = readRequired(redis.opsForValue().get(key(teamId)));
    if (!run.failed() && !run.complete()) throw new ResponseStatusException(CONFLICT, "Finish or fail this Beacon Bounce run before dispatching points");
    return new VerifiedResult(run.securedScore(), run.complete());
  }

  public record VerifiedResult(int score, boolean completed) { }

  private List<List<String>> randomRoutes() {
    List<List<String>> routes = new ArrayList<>();
    for (int length : LENGTHS) {
      List<String> route = new ArrayList<>();
      for (int index = 0; index < length; index += 1) route.add(BEACONS.get(ThreadLocalRandom.current().nextInt(BEACONS.size())));
      routes.add(List.copyOf(route));
    }
    return List.copyOf(routes);
  }
  private String key(UUID teamId) { return PREFIX + teamId; }
  private StartResponse response(Run run) { return new StartResponse(run.id(), run.routes(), run.round(), run.securedScore(), run.failed(), run.complete()); }
  private void save(UUID teamId, Run run) { redis.opsForValue().set(key(teamId), write(run), TTL); }
  private Run readRequired(String value) { if (value == null) throw new ResponseStatusException(CONFLICT, "Start a Beacon Bounce run before selecting a beacon"); return read(value); }
  private Run read(String value) { try { return json.readValue(value, Run.class); } catch (JsonProcessingException exception) { throw new IllegalStateException("Stored Beacon Bounce run is invalid", exception); } }
  private String write(Run run) { try { return json.writeValueAsString(run); } catch (JsonProcessingException exception) { throw new IllegalStateException("Beacon Bounce run could not be saved", exception); } }
}
