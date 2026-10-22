package com.silliconrally.api.admin;

import com.silliconrally.api.event.*;
import com.silliconrally.api.score.ScoreService;
import com.silliconrally.api.team.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
  private final AdminAuthService auth; private final SessionTokenService tokens; private final TeamService teams; private final EventStateService event; private final ScoreService scores;
  public AdminController(AdminAuthService auth, SessionTokenService tokens, TeamService teams, EventStateService event, ScoreService scores) { this.auth = auth; this.tokens = tokens; this.teams = teams; this.event = event; this.scores = scores; }
  @PostMapping("/sessions") public AdminDtos.AdminSessionResponse login(@Valid @RequestBody AdminDtos.LoginRequest request) { return auth.login(request); }
  @GetMapping("/teams") public List<TeamDtos.TeamResponse> listTeams(@RequestHeader(value = "X-Admin-Token", required = false) String token) { tokens.requireAdmin(token); return teams.list(); }
  @PostMapping("/teams") @ResponseStatus(HttpStatus.CREATED) public TeamDtos.TeamResponse createTeam(@RequestHeader(value = "X-Admin-Token", required = false) String token, @Valid @RequestBody TeamDtos.CreateTeamRequest request) { tokens.requireAdmin(token); return teams.create(request); }
  @PatchMapping("/teams/{id}") public TeamDtos.TeamResponse updateTeam(@RequestHeader(value = "X-Admin-Token", required = false) String token, @PathVariable UUID id, @Valid @RequestBody TeamDtos.UpdateTeamRequest request) { tokens.requireAdmin(token); return teams.update(id, request); }
  @GetMapping("/event") public EventDtos.EventStateResponse getEvent(@RequestHeader(value = "X-Admin-Token", required = false) String token) { tokens.requireAdmin(token); return event.get(); }
  @PatchMapping("/event") public EventDtos.EventStateResponse updateEvent(@RequestHeader(value = "X-Admin-Token", required = false) String token, @RequestBody EventDtos.UpdateEventStateRequest request) { tokens.requireAdmin(token); return event.update(request); }
  @PostMapping("/leaderboard/reset") @ResponseStatus(HttpStatus.NO_CONTENT) public void resetLeaderboard(@RequestHeader(value = "X-Admin-Token", required = false) String token) { tokens.requireAdmin(token); scores.resetLeaderboard(); }
}
