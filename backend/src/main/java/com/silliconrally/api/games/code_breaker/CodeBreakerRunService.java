package com.silliconrally.api.games.code_breaker;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.CONFLICT;

/**
 * Owns the single competition run for each team.  The browser receives feedback,
 * never the code or authority to reset attempts, rounds, or points.
 */
@Service
public class CodeBreakerRunService {
  private static final String PREFIX = "sillicon-rally:code-breaker:run:";
  private static final Duration TTL = Duration.ofHours(12);
  private static final int[] ATTEMPTS = {7, 6, 4};
  private static final int[] MAX_POINTS = {20, 30, 50};
  private static final int[] WRONG_GUESS_PENALTY = {1, 2, 5};
  private static final int[] HINT_PENALTY = {2, 3, 5};

  private final StringRedisTemplate redis;
  private final ObjectMapper json;
  private final CodeBreakerPuzzle puzzle;

  public record StartResponse(int round, int securedScore, int roundsCleared, boolean complete, int attemptsRemaining) { }
  public record AttemptResponse(int exact, int shifted, int absent, boolean correct, boolean roundCleared, boolean roundFailed, boolean complete, int securedScore, int roundsCleared, int nextRound, int attemptsRemaining) { }
  public record HintResponse(int position, String symbol) { }
  private record Run(int round, int attemptsUsed, int securedScore, int roundsCleared, boolean hintUsed, boolean complete) { }

  public CodeBreakerRunService(StringRedisTemplate redis, ObjectMapper json) {
    this.redis = redis;
    this.json = json;
    this.puzzle = new CodeBreakerPuzzle();
  }

  public StartResponse start(UUID teamId) {
    String key = key(teamId);
    String stored = redis.opsForValue().get(key);
    if (stored != null) return response(read(stored));
    Run candidate = new Run(0, 0, 0, 0, false, false);
    Boolean created = redis.opsForValue().setIfAbsent(key, write(candidate), TTL);
    return response(Boolean.TRUE.equals(created) ? candidate : readRequired(redis.opsForValue().get(key)));
  }

  public AttemptResponse attempt(UUID teamId, int round, List<String> symbols) {
    Run run = readRequired(redis.opsForValue().get(key(teamId)));
    if (run.complete()) throw new ResponseStatusException(CONFLICT, "This Code Breaker run has already ended");
    if (round != run.round()) throw new ResponseStatusException(CONFLICT, "This is not the active Code Breaker round");

    List<String> answer = puzzle.answerFor(teamId, round);
    CodeBreakerPuzzle.Feedback feedback = puzzle.evaluate(symbols, answer);
    int attemptsUsed = run.attemptsUsed() + 1;
    boolean roundCleared = feedback.exact() == answer.size();
    boolean roundFailed = !roundCleared && attemptsUsed >= ATTEMPTS[round];
    boolean terminalRound = round == ATTEMPTS.length - 1 && (roundCleared || roundFailed);
    int score = run.securedScore();
    int roundsCleared = run.roundsCleared();
    int nextRound = run.round();
    int attemptsRemaining;

    if (roundCleared) {
      score += Math.max(1, MAX_POINTS[round] - (run.attemptsUsed() * WRONG_GUESS_PENALTY[round]) - (run.hintUsed() ? HINT_PENALTY[round] : 0));
      roundsCleared += 1;
      nextRound = terminalRound ? run.round() : run.round() + 1;
      attemptsRemaining = terminalRound ? 0 : ATTEMPTS[nextRound];
    } else if (roundFailed) {
      nextRound = terminalRound ? run.round() : run.round() + 1;
      attemptsRemaining = terminalRound ? 0 : ATTEMPTS[nextRound];
    } else {
      attemptsRemaining = ATTEMPTS[round] - attemptsUsed;
    }

    Run next = (roundCleared || roundFailed)
      ? new Run(nextRound, 0, score, roundsCleared, false, terminalRound)
      : new Run(run.round(), attemptsUsed, score, roundsCleared, run.hintUsed(), false);
    save(teamId, next);
    return new AttemptResponse(feedback.exact(), feedback.shifted(), feedback.absent(), roundCleared, roundCleared, roundFailed, terminalRound, score, roundsCleared, nextRound, attemptsRemaining);
  }

  public HintResponse hint(UUID teamId, int round, int position) {
    Run run = readRequired(redis.opsForValue().get(key(teamId)));
    if (run.complete()) throw new ResponseStatusException(CONFLICT, "This Code Breaker run has already ended");
    if (round != run.round()) throw new ResponseStatusException(CONFLICT, "This is not the active Code Breaker round");
    if (run.hintUsed()) throw new ResponseStatusException(CONFLICT, "This round's hint has already been used");
    List<String> answer = puzzle.answerFor(teamId, round);
    if (position < 0 || position >= answer.size()) throw new ResponseStatusException(CONFLICT, "This position is outside the code");
    save(teamId, new Run(run.round(), run.attemptsUsed(), run.securedScore(), run.roundsCleared(), true, false));
    return new HintResponse(position, answer.get(position));
  }

  /** Returns a score only after all three rounds have reached a terminal state. */
  public VerifiedResult verifiedResult(UUID teamId) {
    Run run = readRequired(redis.opsForValue().get(key(teamId)));
    if (!run.complete()) throw new ResponseStatusException(CONFLICT, "Finish all Code Breaker rounds before dispatching points");
    return new VerifiedResult(run.securedScore(), true);
  }

  public record VerifiedResult(int score, boolean completed) { }

  private String key(UUID teamId) { return PREFIX + teamId; }
  private StartResponse response(Run run) { return new StartResponse(run.round(), run.securedScore(), run.roundsCleared(), run.complete(), run.complete() ? 0 : ATTEMPTS[run.round()] - run.attemptsUsed()); }
  private void save(UUID teamId, Run run) { redis.opsForValue().set(key(teamId), write(run), TTL); }
  private Run readRequired(String stored) { if (stored == null) throw new ResponseStatusException(CONFLICT, "Start a Code Breaker run before making a guess"); return read(stored); }
  private Run read(String stored) { try { return json.readValue(stored, Run.class); } catch (JsonProcessingException exception) { throw new IllegalStateException("Stored Code Breaker run is invalid", exception); } }
  private String write(Run run) { try { return json.writeValueAsString(run); } catch (JsonProcessingException exception) { throw new IllegalStateException("Code Breaker run could not be saved", exception); } }
}
