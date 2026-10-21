package com.silliconrally.api.team;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/** Development-only token store. Replace with secure HTTP-only sessions before production. */
@Service
public class SessionTokenService {
  private final Map<String, UUID> teamTokens = new ConcurrentHashMap<>();
  private final Map<String, String> adminTokens = new ConcurrentHashMap<>();

  public String issueTeamToken(UUID teamId) { String token = UUID.randomUUID().toString(); teamTokens.put(token, teamId); return token; }
  public UUID requireTeam(String token) { UUID teamId = token == null ? null : teamTokens.get(token); if (teamId == null) throw new ResponseStatusException(UNAUTHORIZED, "A team session is required"); return teamId; }
  public void revokeTeam(String token) { if (token != null) teamTokens.remove(token); }
  public String issueAdminToken(String email) { String token = UUID.randomUUID().toString(); adminTokens.put(token, email); return token; }
  public String requireAdmin(String token) { String email = token == null ? null : adminTokens.get(token); if (email == null) throw new ResponseStatusException(UNAUTHORIZED, "An admin session is required"); return email; }
}
