package com.silliconrally.api.games.team_trivia_battle;

import com.silliconrally.api.event.EventStateService;
import com.silliconrally.api.mission.*;
import com.silliconrally.api.team.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/v1/games/team-trivia-battle")
public class TriviaController {
  private final SessionTokenService tokens;
  private final TeamRepository teams;
  private final MissionRepository missions;
  private final EventStateService event;
  private final TriviaService trivia;
  public TriviaController(SessionTokenService tokens, TeamRepository teams, MissionRepository missions, EventStateService event, TriviaService trivia) {
    this.tokens = tokens; this.teams = teams; this.missions = missions; this.event = event; this.trivia = trivia;
  }
  public record CategoryRequest(@NotBlank String category) { }
  public record AnswerRequest(@NotBlank String questionId, @NotNull @Min(0) @Max(3) Integer optionIndex) { }
  public record StateResponse(QuizEngine.Snapshot state) { }
  private record Context(UUID team, UUID mission) { }
  private Context context(String token, boolean writing) {
    UUID team = tokens.requireTeam(token);
    if (teams.findById(team).filter(t -> t.getStatus() == TeamStatus.ACTIVE).isEmpty()) throw new ResponseStatusException(FORBIDDEN, "L'équipe n'est plus active");
    Mission mission = missions.findBySlug("team-trivia-battle").filter(m -> m.getReleaseState() == MissionReleaseState.PUBLISHED).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Cette mission n'est pas publiée"));
    if (writing && (!event.get().isOpen() || event.get().leaderboardLocked())) throw new ResponseStatusException(FORBIDDEN, "L'événement est fermé ou le classement verrouillé");
    return new Context(team, mission.getId());
  }
  @GetMapping("/state") public StateResponse state(@RequestHeader(value = "X-Team-Token", required = false) String token) { var c = context(token, false); return new StateResponse(trivia.state(c.team(), c.mission())); }
  @PostMapping("/start") public StateResponse start(@RequestHeader(value = "X-Team-Token", required = false) String token, @Valid @RequestBody CategoryRequest request) { var c = context(token, true); return new StateResponse(trivia.start(c.team(), c.mission(), request.category())); }
  @PostMapping("/answer") public StateResponse answer(@RequestHeader(value = "X-Team-Token", required = false) String token, @Valid @RequestBody AnswerRequest request) { var c = context(token, true); return new StateResponse(trivia.answer(c.team(), c.mission(), request.questionId(), request.optionIndex())); }
  @PostMapping("/handoff") public StateResponse handoff(@RequestHeader(value = "X-Team-Token", required = false) String token) { var c = context(token, true); return new StateResponse(trivia.handoff(c.team(), c.mission())); }
}
