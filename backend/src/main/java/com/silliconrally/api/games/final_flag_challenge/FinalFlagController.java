package com.silliconrally.api.games.final_flag_challenge;

import com.silliconrally.api.event.EventStateService;
import com.silliconrally.api.mission.*;
import com.silliconrally.api.score.GameScoreRepository;
import com.silliconrally.api.team.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/v1/games/final-flag-challenge")
public class FinalFlagController {
  private final SessionTokenService tokens;
  private final TeamRepository teams;
  private final MissionRepository missions;
  private final GameScoreRepository scores;
  private final EventStateService event;
  private final FinalFlagService flags;
  public FinalFlagController(SessionTokenService tokens, TeamRepository teams, MissionRepository missions,
      GameScoreRepository scores, EventStateService event, FinalFlagService flags) {
    this.tokens = tokens; this.teams = teams; this.missions = missions;
    this.scores = scores; this.event = event; this.flags = flags;
  }
  public record Submission(@NotBlank @Size(max = 512) String flag) { }
  @ExceptionHandler({org.springframework.web.bind.MethodArgumentNotValidException.class,
      org.springframework.http.converter.HttpMessageNotReadableException.class})
  @ResponseStatus(BAD_REQUEST)
  public java.util.Map<String, String> invalidSubmission(Exception ignored) {
    return java.util.Map.of("message", "Enter a non-empty flag of at most 512 characters");
  }
  private record Context(String key, boolean recorded) { }
  private Context context(String token, boolean writing) {
    var team = teams.findById(tokens.requireTeam(token)).filter(t -> t.getStatus() == TeamStatus.ACTIVE)
        .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "This team is not active"));
    var mission = missions.findBySlug("final-flag-challenge").filter(m -> m.getReleaseState() == MissionReleaseState.PUBLISHED)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "This challenge is not published"));
    if (writing) {
      var status = event.get();
      if (!status.isOpen() || status.leaderboardLocked()) throw new ResponseStatusException(FORBIDDEN, "The event is closed or the leaderboard is locked");
      if (mission.getMaxScore() < 100) throw new ResponseStatusException(CONFLICT, "The final challenge must allow 100 points");
    }
    return new Context("sillicon-rally:final-flag:v1:" + mission.getId() + ":" + team.getId(), scores.findByTeamAndMission(team, mission).isPresent());
  }
  @GetMapping("/state") public FinalFlagService.State state(@RequestHeader(value = "X-Team-Token", required = false) String token) {
    var c = context(token, false); return flags.state(c.key(), c.recorded());
  }
  @PostMapping("/verify") public FinalFlagService.State verify(@RequestHeader(value = "X-Team-Token", required = false) String token, @Valid @RequestBody Submission submission) {
    var c = context(token, true);
    if (c.recorded()) throw new ResponseStatusException(CONFLICT, "This team has already completed the final challenge");
    return flags.verify(c.key(), submission.flag());
  }
}
