package com.silliconrally.api.team;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class TeamSessionController {
  private final TeamService teams; private final SessionTokenService tokens;
  public TeamSessionController(TeamService teams, SessionTokenService tokens) { this.teams = teams; this.tokens = tokens; }
  @PostMapping("/team-sessions") @ResponseStatus(HttpStatus.CREATED) public TeamDtos.TeamSessionResponse join(@Valid @RequestBody TeamDtos.JoinRequest request) { return teams.join(request); }
  @GetMapping("/me") public TeamDtos.TeamResponse me(@RequestHeader(value = "X-Team-Token", required = false) String token) { return teams.currentTeam(token); }
  @DeleteMapping("/team-sessions/current") @ResponseStatus(HttpStatus.NO_CONTENT) public void leave(@RequestHeader(value = "X-Team-Token", required = false) String token) { tokens.revokeTeam(token); }
}
