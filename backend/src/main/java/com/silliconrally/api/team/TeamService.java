package com.silliconrally.api.team;

import java.util.List;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
  private final String sharedJoinCode;

  public TeamService(TeamRepository teams, SessionTokenService tokens, @Value("${app.event.open-team-registration}") boolean openRegistration, @Value("${app.event.team-join-code:}") String sharedJoinCode) { this.teams = teams; this.tokens = tokens; this.openRegistration = openRegistration; this.sharedJoinCode = sharedJoinCode == null ? "" : sharedJoinCode.trim(); }

  public TeamDtos.TeamSessionResponse join(TeamDtos.JoinRequest request) {
    String suppliedCode = request.joinCode() == null ? "" : request.joinCode();
    String name = request.teamName().trim();
    Team team = teams.findByDisplayNameIgnoreCase(name).orElse(null);
    if (!sharedJoinCode.isEmpty()) {
      if (!MessageDigest.isEqual(sharedJoinCode.getBytes(StandardCharsets.UTF_8), suppliedCode.getBytes(StandardCharsets.UTF_8))) {
        throw new ResponseStatusException(FORBIDDEN, "Invalid event join code");
      }
    } else if (team != null) {
      if (team.getJoinCodeHash() == null || !encoder.matches(suppliedCode, team.getJoinCodeHash())) {
        throw new ResponseStatusException(FORBIDDEN, "A valid team join code is required");
      }
    }
    if (team == null) team = createOpenRegistrationTeam(name);
    if (team.getStatus() != TeamStatus.ACTIVE) throw new ResponseStatusException(FORBIDDEN, "This team is inactive");
    return new TeamDtos.TeamSessionResponse(tokens.issueTeamToken(team.getId()), TeamDtos.from(team));
  }

  private Team createOpenRegistrationTeam(String name) {
    if (!openRegistration) throw new ResponseStatusException(FORBIDDEN, "Team registration is closed");
    if (sharedJoinCode.isEmpty()) throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Team joining is unavailable until the organizer configures APP_TEAM_JOIN_CODE");
    return teams.save(new Team(name, null));
  }

  @Transactional(readOnly = true) public TeamDtos.TeamResponse currentTeam(String token) { return TeamDtos.from(requireTeam(tokens.requireTeam(token))); }
  @Transactional(readOnly = true) public List<TeamDtos.TeamResponse> list() { return teams.findAll().stream().map(TeamDtos::from).toList(); }
  public TeamDtos.TeamResponse create(TeamDtos.CreateTeamRequest request) { if (teams.findByDisplayNameIgnoreCase(request.displayName().trim()).isPresent()) throw new ResponseStatusException(CONFLICT, "Team name is already in use"); return TeamDtos.from(teams.save(new Team(request.displayName().trim(), request.joinCode() == null || request.joinCode().isBlank() ? null : encoder.encode(request.joinCode())))); }
  public TeamDtos.TeamResponse update(UUID id, TeamDtos.UpdateTeamRequest request) { Team team = requireTeam(id); if (request.displayName() != null && !request.displayName().isBlank()) team.rename(request.displayName().trim()); if (request.status() != null) team.setStatus(request.status()); return TeamDtos.from(team); }
  private Team requireTeam(UUID id) { return teams.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Team not found")); }
}
