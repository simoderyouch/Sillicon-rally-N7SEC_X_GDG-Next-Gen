package com.silliconrally.api.games.word_scramble;

import com.silliconrally.api.event.EventStateService;
import com.silliconrally.api.mission.*;
import com.silliconrally.api.score.GameScoreRepository;
import com.silliconrally.api.team.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

/** Reserves one completion per actual team/mission, without recording points. */
@RestController
@RequestMapping("/api/v1/games/word-scramble/completion")
public class CompletionController {
  private final SessionTokenService tokens;
  private final TeamRepository teams;
  private final MissionRepository missions;
  private final GameScoreRepository scores;
  private final EventStateService event;
  private final StringRedisTemplate redis;
  public CompletionController(SessionTokenService tokens, TeamRepository teams, MissionRepository missions, GameScoreRepository scores, EventStateService event, StringRedisTemplate redis) {
    this.tokens = tokens; this.teams = teams; this.missions = missions; this.scores = scores; this.event = event; this.redis = redis;
  }
  public record Completion(boolean locked, Integer score, boolean claimed) { }
  public record Claim(@NotNull @Min(0) @Max(100) Integer score) { }
  private record Context(Team team, Mission mission, String key) { }
  private Context context(String token) {
    var team = teams.findById(tokens.requireTeam(token)).filter(t -> t.getStatus() == TeamStatus.ACTIVE).orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Cette équipe n'est pas active"));
    var mission = missions.findBySlug("word-scramble").filter(m -> m.getReleaseState() == MissionReleaseState.PUBLISHED).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Cette mission n'est pas publiée"));
    return new Context(team, mission, "sillicon-rally:word-scramble:completion:v1:" + mission.getId() + ":" + team.getId());
  }
  private Completion existing(Context c) {
    // Recognize points recorded before this lock was introduced, too.
    var recorded = scores.findByTeamAndMission(c.team(), c.mission());
    if (recorded.isPresent()) return new Completion(true, recorded.get().getScore(), false);
    String marker = redis.opsForValue().get(c.key());
    return marker == null ? new Completion(false, null, false) : new Completion(true, Integer.valueOf(marker), false);
  }
  @GetMapping public Completion state(@RequestHeader(value = "X-Team-Token", required = false) String token) { return existing(context(token)); }
  @PostMapping public Completion claim(@RequestHeader(value = "X-Team-Token", required = false) String token, @Valid @RequestBody Claim claim) {
    var c = context(token); var previous = existing(c);
    if (previous.locked()) return previous;
    var status = event.get();
    if (!status.isOpen() || status.leaderboardLocked()) throw new ResponseStatusException(FORBIDDEN, "L'événement est fermé ou le classement verrouillé");
    if (claim.score() > c.mission().getMaxScore()) throw new ResponseStatusException(BAD_REQUEST, "Le score dépasse le plafond de la mission");
    // No TTL and atomic SET NX: reloads, renewed tokens, and other tabs cannot grant another run.
    if (Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(c.key(), claim.score().toString()))) return new Completion(true, claim.score(), true);
    return existing(c);
  }
}
