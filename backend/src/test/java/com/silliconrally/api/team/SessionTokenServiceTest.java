package com.silliconrally.api.team;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

class SessionTokenServiceTest {
  @Test
  void refreshes_a_valid_team_session_for_an_active_competition_client() {
    StringRedisTemplate redis = org.mockito.Mockito.mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked") ValueOperations<String, String> values = org.mockito.Mockito.mock(ValueOperations.class);
    UUID teamId = UUID.randomUUID();
    Duration ttl = Duration.ofHours(24);
    when(redis.opsForValue()).thenReturn(values);
    when(values.get("sillicon-rally:team-session:team-token")).thenReturn(teamId.toString());
    SessionTokenService service = new SessionTokenService(redis, ttl);

    assertThat(service.requireTeam("team-token")).isEqualTo(teamId);
    verify(redis).expire("sillicon-rally:team-session:team-token", ttl);
  }
}
