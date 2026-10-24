package com.silliconrally.api.team;

import com.silliconrally.api.event.EventState;
import com.silliconrally.api.event.EventStateRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
@Transactional
public class TeamJoinCodeService {
  private final EventStateRepository states;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
  private final String configuredCode;

  public TeamJoinCodeService(EventStateRepository states, @Value("${app.event.team-join-code:}") String configuredCode) {
    this.states = states;
    this.configuredCode = configuredCode == null ? "" : configuredCode.trim();
  }

  public boolean isConfigured() {
    return state().getTeamJoinCodeHash() != null || !configuredCode.isEmpty();
  }

  public boolean matches(String candidate) {
    String storedHash = state().getTeamJoinCodeHash();
    if (storedHash != null) return encoder.matches(candidate == null ? "" : candidate, storedHash);
    return !configuredCode.isEmpty() && MessageDigest.isEqual(
        configuredCode.getBytes(StandardCharsets.UTF_8),
        (candidate == null ? "" : candidate).getBytes(StandardCharsets.UTF_8));
  }

  public void update(String joinCode) {
    state().setTeamJoinCodeHash(encoder.encode(joinCode));
  }

  private EventState state() {
    return states.findById(1L).orElseThrow(() -> new ResponseStatusException(INTERNAL_SERVER_ERROR, "Event state has not been initialized"));
  }

  public record Status(boolean configured) { }
}
