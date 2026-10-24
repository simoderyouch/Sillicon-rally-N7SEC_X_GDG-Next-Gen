package com.silliconrally.api.games.code_breaker;

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

class CodeBreakerRunServiceTest {
  @Test
  void keeps_each_teams_code_breaker_progress_in_its_own_run() {
    StringRedisTemplate redis = org.mockito.Mockito.mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked") ValueOperations<String, String> values = org.mockito.Mockito.mock(ValueOperations.class);
    Map<String, String> stored = new ConcurrentHashMap<>();
    when(redis.opsForValue()).thenReturn(values);
    when(values.get(anyString())).thenAnswer(invocation -> stored.get(invocation.getArgument(0)));
    when(values.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenAnswer(invocation ->
      stored.putIfAbsent(invocation.getArgument(0), invocation.getArgument(1)) == null);
    doAnswer(invocation -> { stored.put(invocation.getArgument(0), invocation.getArgument(1)); return null; })
      .when(values).set(anyString(), anyString(), any(Duration.class));
    CodeBreakerRunService service = new CodeBreakerRunService(redis, new ObjectMapper());
    UUID firstTeam = UUID.randomUUID();
    UUID secondTeam = UUID.randomUUID();
    CodeBreakerPuzzle puzzle = new CodeBreakerPuzzle();

    service.start(firstTeam);
    service.attempt(firstTeam, 0, wrongCode(puzzle, 0));

    assertThat(service.start(firstTeam)).extracting(
      CodeBreakerRunService.StartResponse::round,
      CodeBreakerRunService.StartResponse::attemptsRemaining
    ).containsExactly(0, 6);
    assertThat(service.start(secondTeam)).extracting(
      CodeBreakerRunService.StartResponse::round,
      CodeBreakerRunService.StartResponse::attemptsRemaining,
      CodeBreakerRunService.StartResponse::securedScore
    ).containsExactly(0, 7, 0);
  }

  @Test
  void keepsAttemptBudgetAndMovesPastAFailedRoundWithoutAllowingARetry() {
    StringRedisTemplate redis = org.mockito.Mockito.mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked") ValueOperations<String, String> values = org.mockito.Mockito.mock(ValueOperations.class);
    AtomicReference<String> stored = new AtomicReference<>();
    when(redis.opsForValue()).thenReturn(values);
    when(values.get(anyString())).thenAnswer(invocation -> stored.get());
    when(values.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenAnswer(invocation -> { stored.set(invocation.getArgument(1)); return true; });
    doAnswer(invocation -> { stored.set(invocation.getArgument(1)); return null; }).when(values).set(anyString(), anyString(), any(Duration.class));
    CodeBreakerRunService service = new CodeBreakerRunService(redis, new ObjectMapper());
    UUID team = UUID.randomUUID();
    CodeBreakerPuzzle puzzle = new CodeBreakerPuzzle();
    List<String> wrongCode = wrongCode(puzzle, 0);

    assertThat(service.start(team).attemptsRemaining()).isEqualTo(7);
    CodeBreakerRunService.AttemptResponse last = null;
    for (int attempt = 0; attempt < 7; attempt += 1) last = service.attempt(team, 0, wrongCode);

    assertThat(last).isNotNull();
    assertThat(last.roundFailed()).isTrue();
    assertThat(last.nextRound()).isEqualTo(1);
    assertThat(last.attemptsRemaining()).isEqualTo(6);
    assertThat(service.start(team).round()).isEqualTo(1);
    assertThatThrownBy(() -> service.attempt(team, 0, wrongCode))
      .isInstanceOf(ResponseStatusException.class)
      .hasMessageContaining("not the active");

    for (int attempt = 0; attempt < 6; attempt += 1) service.attempt(team, 1, wrongCode(puzzle, 1));
    for (int attempt = 0; attempt < 4; attempt += 1) service.attempt(team, 2, wrongCode(puzzle, 2));
    assertThat(service.verifiedResult(team)).extracting(CodeBreakerRunService.VerifiedResult::score, CodeBreakerRunService.VerifiedResult::completed).containsExactly(0, true);
  }

  private List<String> wrongCode(CodeBreakerPuzzle puzzle, int round) {
    List<String> guess = new java.util.ArrayList<>(puzzle.answerFor(round));
    guess.set(0, guess.get(0).equals("comet") ? "orbit" : "comet");
    return guess;
  }
}
