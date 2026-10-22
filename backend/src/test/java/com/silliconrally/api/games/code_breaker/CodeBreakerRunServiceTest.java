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
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.server.ResponseStatusException;

class CodeBreakerRunServiceTest {
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
    List<String> wrongCode = wrongCode(puzzle, team, 0);

    assertThat(service.start(team).attemptsRemaining()).isEqualTo(6);
    CodeBreakerRunService.AttemptResponse last = null;
    for (int attempt = 0; attempt < 6; attempt += 1) last = service.attempt(team, 0, wrongCode);

    assertThat(last).isNotNull();
    assertThat(last.roundFailed()).isTrue();
    assertThat(last.nextRound()).isEqualTo(1);
    assertThat(last.attemptsRemaining()).isEqualTo(5);
    assertThat(service.start(team).round()).isEqualTo(1);
    assertThatThrownBy(() -> service.attempt(team, 0, wrongCode))
      .isInstanceOf(ResponseStatusException.class)
      .hasMessageContaining("not the active");

    for (int attempt = 0; attempt < 5; attempt += 1) service.attempt(team, 1, wrongCode(puzzle, team, 1));
    for (int attempt = 0; attempt < 4; attempt += 1) service.attempt(team, 2, wrongCode(puzzle, team, 2));
    assertThat(service.verifiedResult(team)).extracting(CodeBreakerRunService.VerifiedResult::score, CodeBreakerRunService.VerifiedResult::completed).containsExactly(0, true);
  }

  private List<String> wrongCode(CodeBreakerPuzzle puzzle, UUID team, int round) {
    List<String> guess = new java.util.ArrayList<>(puzzle.answerFor(team, round));
    guess.set(0, guess.get(0).equals("comet") ? "orbit" : "comet");
    return guess;
  }
}
