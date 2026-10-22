package com.silliconrally.api.team;

import java.util.UUID;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/** Shared opaque sessions, so either API instance can authenticate an event client. */
@Service
public class SessionTokenService {
  private static final String TEAM_PREFIX = "sillicon-rally:team-session:";
  private static final String ADMIN_PREFIX = "sillicon-rally:admin-session:";
  private final StringRedisTemplate redis;
  private final Duration ttl;

  public SessionTokenService(StringRedisTemplate redis, @Value("${app.session.token-ttl}") Duration ttl) { this.redis = redis; this.ttl = ttl; }

  public String issueTeamToken(UUID teamId) { String token = UUID.randomUUID().toString(); redis.opsForValue().set(TEAM_PREFIX + token, teamId.toString(), ttl); return token; }
  public UUID requireTeam(String token) {
    String teamId = token == null ? null : redis.opsForValue().get(TEAM_PREFIX + token);
    try { if (teamId != null) return UUID.fromString(teamId); } catch (IllegalArgumentException ignored) { }
    throw new ResponseStatusException(UNAUTHORIZED, "A team session is required");
  }
  public void revokeTeam(String token) { if (token != null) redis.delete(TEAM_PREFIX + token); }
  public void revokeAllTeamSessions() { var keys = redis.keys(TEAM_PREFIX + "*"); if (keys != null && !keys.isEmpty()) redis.delete(keys); }
  public String issueAdminToken(String email) { String token = UUID.randomUUID().toString(); redis.opsForValue().set(ADMIN_PREFIX + token, email, ttl); return token; }
  public String requireAdmin(String token) { String email = token == null ? null : redis.opsForValue().get(ADMIN_PREFIX + token); if (email == null) throw new ResponseStatusException(UNAUTHORIZED, "An admin session is required"); return email; }
}
