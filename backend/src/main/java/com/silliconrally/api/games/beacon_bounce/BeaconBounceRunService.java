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
  private static final int MAX_HINTS = 3;

  private final StringRedisTemplate redis;
  private final ObjectMapper json;
  public BeaconBounceRunService(StringRedisTemplate redis, ObjectMapper json) { this.redis = redis; this.json = json; }

  public record StartResponse(String runId, List<List<String>> routes, int round, int securedScore, int hintsUsed, int hintsRemaining, boolean failed, boolean complete) { }
  public record AttemptResponse(boolean correct, boolean roundCleared, boolean failed, boolean complete, int securedScore, int nextRound) { }
  public record HintResponse(List<String> route, int penalty, int securedScore, int hintsUsed, int hintsRemaining) { }
  // hintUsed is retained for deserializing in-progress runs created before hints became run-wide.
  private record Run(String id, List<List<String>> routes, int round, int step, int securedScore, boolean hintUsed, int hintsUsed, boolean failed, boolean complete) { }

  public StartResponse start(UUID teamId) {
    String key = key(teamId);
    String existing = redis.opsForValue().get(key);
    if (existing != null) return response(read(existing));
    Run candidate = new Run(UUID.randomUUID().toString(), randomRoutes(), 0, 0, 0, false, 0, false, false);
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
      Run failed = new Run(run.id(), run.routes(), run.round(), run.step(), run.securedScore(), false, hintCount(run), true, false);
      save(teamId, failed);
      return new AttemptResponse(false, false, true, false, displayedScore(failed), failed.round());
    }

    int nextStep = run.step() + 1;
    if (nextStep < route.size()) {
      Run next = new Run(run.id(), run.routes(), run.round(), nextStep, run.securedScore(), false, hintCount(run), false, false);
      save(teamId, next);
      return new AttemptResponse(true, false, false, false, displayedScore(next), next.round());
    }

    int securedScore = run.securedScore() + POINTS[run.round()];
    boolean complete = run.round() == LENGTHS.length - 1;
    Run next = new Run(run.id(), run.routes(), complete ? run.round() : run.round() + 1, 0, securedScore, false, hintCount(run), false, complete);
    save(teamId, next);
    return new AttemptResponse(true, true, false, complete, displayedScore(next), next.round());
  }

  /** Replaces the active route up to three times, each time deducting twice its points. */
  public HintResponse hint(UUID teamId, String runId, int round) {
    Run run = readRequired(redis.opsForValue().get(key(teamId)));
    if (!run.id().equals(runId)) throw new ResponseStatusException(BAD_REQUEST, "This run does not belong to the current team");
    if (run.failed() || run.complete()) throw new ResponseStatusException(CONFLICT, "This competition run has already ended");
    if (round != run.round()) throw new ResponseStatusException(BAD_REQUEST, "This is not the active round");
    if (run.step() != 0) throw new ResponseStatusException(CONFLICT, "Request a new route before choosing a beacon");
    if (hintCount(run) >= MAX_HINTS) throw new ResponseStatusException(CONFLICT, "All three new-route hints have been used");

    List<String> replacement = randomRoute(LENGTHS[round], run.routes().get(round));
    List<List<String>> routes = new ArrayList<>(run.routes());
    routes.set(round, replacement);
    int penalty = POINTS[round] * 2;
    Run next = new Run(run.id(), List.copyOf(routes), run.round(), 0, run.securedScore() - penalty, false, hintCount(run) + 1, false, false);
    save(teamId, next);
    return new HintResponse(replacement, penalty, displayedScore(next), hintCount(next), MAX_HINTS - hintCount(next));
  }

  /** Returns a score only once the team's single run has failed or completed. */
  public VerifiedResult verifiedResult(UUID teamId) {
    Run run = readRequired(redis.opsForValue().get(key(teamId)));
    if (!run.failed() && !run.complete()) throw new ResponseStatusException(CONFLICT, "Finish or fail this Beacon Bounce run before dispatching points");
    return new VerifiedResult(displayedScore(run), run.complete());
  }

  public record VerifiedResult(int score, boolean completed) { }

  private List<List<String>> randomRoutes() {
    List<List<String>> routes = new ArrayList<>();
    for (int length : LENGTHS) routes.add(randomRoute(length, List.of()));
    return List.copyOf(routes);
  }
  private List<String> randomRoute(int length, List<String> previous) {
    List<String> route;
    do {
      route = new ArrayList<>();
      for (int index = 0; index < length; index += 1) route.add(BEACONS.get(ThreadLocalRandom.current().nextInt(BEACONS.size())));
    } while (route.equals(previous));
    return List.copyOf(route);
  }
  private String key(UUID teamId) { return PREFIX + teamId; }
  private int hintCount(Run run) { return Math.max(run.hintsUsed(), run.hintUsed() ? 1 : 0); }
  private int displayedScore(Run run) { return Math.max(0, run.securedScore()); }
  private StartResponse response(Run run) { return new StartResponse(run.id(), run.routes(), run.round(), displayedScore(run), hintCount(run), MAX_HINTS - hintCount(run), run.failed(), run.complete()); }
  private void save(UUID teamId, Run run) { redis.opsForValue().set(key(teamId), write(run), TTL); }
  private Run readRequired(String value) { if (value == null) throw new ResponseStatusException(CONFLICT, "Start a Beacon Bounce run before selecting a beacon"); return read(value); }
  private Run read(String value) { try { return json.readValue(value, Run.class); } catch (JsonProcessingException exception) { throw new IllegalStateException("Stored Beacon Bounce run is invalid", exception); } }
  private String write(Run run) { try { return json.writeValueAsString(run); } catch (JsonProcessingException exception) { throw new IllegalStateException("Beacon Bounce run could not be saved", exception); } }
}
