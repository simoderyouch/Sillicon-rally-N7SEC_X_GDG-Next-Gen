package com.silliconrally.api.team;

import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
@Transactional
public class TeamService {
  private final TeamRepository teams;
  private final SessionTokenService tokens;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
  private final boolean openRegistration;

  public TeamService(TeamRepository teams, SessionTokenService tokens, @Value("${app.event.open-team-registration}") boolean openRegistration) { this.teams = teams; this.tokens = tokens; this.openRegistration = openRegistration; }

  public TeamDtos.TeamSessionResponse join(TeamDtos.JoinRequest request) {
    String name = request.teamName().trim();
    Team team = teams.findByDisplayNameIgnoreCase(name).orElseGet(() -> createOpenRegistrationTeam(name, request.joinCode()));
    if (team.getStatus() != TeamStatus.ACTIVE) throw new ResponseStatusException(FORBIDDEN, "This team is inactive");
    if (team.getJoinCodeHash() != null && !encoder.matches(request.joinCode() == null ? "" : request.joinCode(), team.getJoinCodeHash())) throw new ResponseStatusException(FORBIDDEN, "Invalid team join code");
    return new TeamDtos.TeamSessionResponse(tokens.issueTeamToken(team.getId()), TeamDtos.from(team));
  }

  private Team createOpenRegistrationTeam(String name, String joinCode) {
    if (!openRegistration) throw new ResponseStatusException(FORBIDDEN, "Team registration is closed");
    return teams.save(new Team(name, joinCode == null || joinCode.isBlank() ? null : encoder.encode(joinCode)));
  }

  @Transactional(readOnly = true) public TeamDtos.TeamResponse currentTeam(String token) { return TeamDtos.from(requireTeam(tokens.requireTeam(token))); }
  @Transactional(readOnly = true) public List<TeamDtos.TeamResponse> list() { return teams.findAll().stream().map(TeamDtos::from).toList(); }
  public TeamDtos.TeamResponse create(TeamDtos.CreateTeamRequest request) { if (teams.findByDisplayNameIgnoreCase(request.displayName().trim()).isPresent()) throw new ResponseStatusException(CONFLICT, "Team name is already in use"); return TeamDtos.from(teams.save(new Team(request.displayName().trim(), request.joinCode() == null || request.joinCode().isBlank() ? null : encoder.encode(request.joinCode())))); }
  public TeamDtos.TeamResponse update(UUID id, TeamDtos.UpdateTeamRequest request) { Team team = requireTeam(id); if (request.displayName() != null && !request.displayName().isBlank()) team.rename(request.displayName().trim()); if (request.status() != null) team.setStatus(request.status()); return TeamDtos.from(team); }
  private Team requireTeam(UUID id) { return teams.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Team not found")); }
}
