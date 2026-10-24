package com.silliconrally.api.games.beacon_bounce;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.server.ResponseStatusException;

class BeaconBounceRunServiceTest {
  @Test
  void keeps_each_teams_beacon_run_and_hints_separate() {
    StringRedisTemplate redis = org.mockito.Mockito.mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked") ValueOperations<String, String> values = org.mockito.Mockito.mock(ValueOperations.class);
    Map<String, String> stored = new ConcurrentHashMap<>();
    when(redis.opsForValue()).thenReturn(values);
    when(values.get(anyString())).thenAnswer(invocation -> stored.get(invocation.getArgument(0)));
    when(values.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenAnswer(invocation ->
      stored.putIfAbsent(invocation.getArgument(0), invocation.getArgument(1)) == null);
    doAnswer(invocation -> { stored.put(invocation.getArgument(0), invocation.getArgument(1)); return null; })
      .when(values).set(anyString(), anyString(), any(Duration.class));
    BeaconBounceRunService service = new BeaconBounceRunService(redis, new ObjectMapper());
    UUID firstTeam = UUID.randomUUID();
    UUID secondTeam = UUID.randomUUID();

    BeaconBounceRunService.StartResponse first = service.start(firstTeam);
    service.hint(firstTeam, first.runId(), 0);
    BeaconBounceRunService.StartResponse second = service.start(secondTeam);

    assertThat(second.runId()).isNotEqualTo(first.runId());
    assertThat(service.start(firstTeam)).extracting(
      BeaconBounceRunService.StartResponse::hintsUsed,
      BeaconBounceRunService.StartResponse::hintsRemaining
    ).containsExactly(1, 2);
    assertThat(second).extracting(
      BeaconBounceRunService.StartResponse::hintsUsed,
      BeaconBounceRunService.StartResponse::hintsRemaining,
      BeaconBounceRunService.StartResponse::securedScore
    ).containsExactly(0, 3, 0);
  }

  @Test
  void createsOneRandomRunThenKeepsItsScoreAndTerminalFailure() {
    StringRedisTemplate redis = org.mockito.Mockito.mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked") ValueOperations<String, String> values = org.mockito.Mockito.mock(ValueOperations.class);
    AtomicReference<String> stored = new AtomicReference<>();
    when(redis.opsForValue()).thenReturn(values);
    when(values.get(anyString())).thenAnswer(invocation -> stored.get());
    when(values.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenAnswer(invocation -> { stored.set(invocation.getArgument(1)); return true; });
    doAnswer(invocation -> { stored.set(invocation.getArgument(1)); return null; }).when(values).set(anyString(), anyString(), any(Duration.class));
    BeaconBounceRunService service = new BeaconBounceRunService(redis, new ObjectMapper());
    UUID team = UUID.randomUUID();

    BeaconBounceRunService.StartResponse run = service.start(team);
    assertThat(run.routes()).hasSize(6);
    assertThat(run.routes()).extracting(List::size).containsExactly(3, 3, 4, 6, 7, 9);
    assertThat(service.start(team).runId()).isEqualTo(run.runId());

    BeaconBounceRunService.AttemptResponse first = service.attempt(team, run.runId(), 0, run.routes().get(0).get(0));
    assertThat(first.correct()).isTrue();
    String wrong = run.routes().get(0).get(1).equals("sun") ? "rose" : "sun";
    BeaconBounceRunService.AttemptResponse failed = service.attempt(team, run.runId(), 0, wrong);
    assertThat(failed.failed()).isTrue();
    assertThat(service.verifiedResult(team)).extracting(BeaconBounceRunService.VerifiedResult::score, BeaconBounceRunService.VerifiedResult::completed).containsExactly(0, false);
    assertThatThrownBy(() -> service.attempt(team, run.runId(), 0, wrong)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("already ended");
  }

  @Test
  void replaces_the_active_route_up_to_three_times_and_tracks_the_full_penalty() {
    StringRedisTemplate redis = org.mockito.Mockito.mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked") ValueOperations<String, String> values = org.mockito.Mockito.mock(ValueOperations.class);
    AtomicReference<String> stored = new AtomicReference<>();
    when(redis.opsForValue()).thenReturn(values);
    when(values.get(anyString())).thenAnswer(invocation -> stored.get());
    when(values.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenAnswer(invocation -> { stored.set(invocation.getArgument(1)); return true; });
    doAnswer(invocation -> { stored.set(invocation.getArgument(1)); return null; }).when(values).set(anyString(), anyString(), any(Duration.class));
    BeaconBounceRunService service = new BeaconBounceRunService(redis, new ObjectMapper());
    UUID team = UUID.randomUUID();
    BeaconBounceRunService.StartResponse run = service.start(team);

    BeaconBounceRunService.HintResponse first = service.hint(team, run.runId(), 0);
    BeaconBounceRunService.HintResponse second = service.hint(team, run.runId(), 0);
    BeaconBounceRunService.HintResponse third = service.hint(team, run.runId(), 0);

    assertThat(first.route()).isNotEqualTo(run.routes().get(0));
    assertThat(second.route()).isNotEqualTo(first.route());
    assertThat(third.route()).isNotEqualTo(second.route());
    assertThat(third).extracting(BeaconBounceRunService.HintResponse::penalty, BeaconBounceRunService.HintResponse::hintsUsed, BeaconBounceRunService.HintResponse::hintsRemaining).containsExactly(16, 3, 0);
    assertThatThrownBy(() -> service.hint(team, run.runId(), 0)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("All three");
    for (String beacon : third.route()) service.attempt(team, run.runId(), 0, beacon);

    assertThat(service.start(team)).extracting(BeaconBounceRunService.StartResponse::securedScore, BeaconBounceRunService.StartResponse::hintsUsed, BeaconBounceRunService.StartResponse::hintsRemaining).containsExactly(0, 3, 0);
  }
}
