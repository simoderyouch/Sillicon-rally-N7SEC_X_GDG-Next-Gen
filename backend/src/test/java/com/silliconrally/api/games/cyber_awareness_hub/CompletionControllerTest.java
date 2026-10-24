package com.silliconrally.api.games.cyber_awareness_hub;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.silliconrally.api.event.*;
import com.silliconrally.api.mission.*;
import com.silliconrally.api.score.*;
import com.silliconrally.api.team.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

class CompletionControllerTest {
  @Test @SuppressWarnings("unchecked") void locksEachActualTeamAndMissionAndNeverWritesAScore() {
    var tokens = mock(SessionTokenService.class); var teams = mock(TeamRepository.class);
    var missions = mock(MissionRepository.class); var scores = mock(GameScoreRepository.class);
    var event = mock(EventStateService.class); var redis = mock(StringRedisTemplate.class);
    ValueOperations<String, String> values = mock(ValueOperations.class);
    Map<String, String> stored = new HashMap<>();
    when(redis.opsForValue()).thenReturn(values);
    when(values.get(anyString())).thenAnswer(call -> stored.get(call.getArgument(0)));
    when(values.setIfAbsent(anyString(), anyString())).thenAnswer(call -> stored.putIfAbsent(call.getArgument(0), call.getArgument(1)) == null);
    var a = new Team("Team A", null); var b = new Team("Team B", null);
    when(tokens.requireTeam("token-a")).thenReturn(a.getId()); when(tokens.requireTeam("renewed-a")).thenReturn(a.getId()); when(tokens.requireTeam("token-b")).thenReturn(b.getId());
    when(teams.findById(a.getId())).thenReturn(Optional.of(a)); when(teams.findById(b.getId())).thenReturn(Optional.of(b));
    var mission = new Mission("cyber-awareness-hub", "Phishing Detective", "Description", 100, MissionReleaseState.PUBLISHED);
    when(missions.findBySlug("cyber-awareness-hub")).thenReturn(Optional.of(mission));
    when(scores.findByTeamAndMission(any(), any())).thenReturn(Optional.empty());
    when(event.get()).thenReturn(new EventDtos.EventStateResponse(true, false));
    var controller = new CompletionController(tokens, teams, missions, scores, event, redis);
    assertThat(controller.state("token-a").locked()).isFalse();
    assertThat(controller.claim("token-a", new CompletionController.Claim(75)).claimed()).isTrue();
    assertThat(controller.state("renewed-a").score()).isEqualTo(75);
    assertThat(controller.claim("renewed-a", new CompletionController.Claim(100)).claimed()).isFalse();
    assertThat(controller.state("token-b").locked()).isFalse();
    assertThat(controller.claim("token-b", new CompletionController.Claim(50)).claimed()).isTrue();
    assertThat(controller.state("token-a").score()).isEqualTo(75);
    verify(scores, never()).save(any());
  }
  @Test void recognizesPreviouslyRecordedScoresAndRejectsMissingSessions() {
    var tokens = mock(SessionTokenService.class); var teams = mock(TeamRepository.class);
    var missions = mock(MissionRepository.class); var scores = mock(GameScoreRepository.class);
    var event = mock(EventStateService.class); var redis = mock(StringRedisTemplate.class);
    var team = new Team("Existing team", null); var mission = new Mission("cyber-awareness-hub", "Game", "Description", 100, MissionReleaseState.PUBLISHED);
    when(tokens.requireTeam("existing")).thenReturn(team.getId()); when(teams.findById(team.getId())).thenReturn(Optional.of(team));
    when(missions.findBySlug("cyber-awareness-hub")).thenReturn(Optional.of(mission));
    when(scores.findByTeamAndMission(team, mission)).thenReturn(Optional.of(new GameScore(team, mission, 83, true)));
    var controller = new CompletionController(tokens, teams, missions, scores, event, redis);
    assertThat(controller.state("existing").locked()).isTrue();
    assertThat(controller.claim("existing", new CompletionController.Claim(100)).score()).isEqualTo(83);
    verifyNoInteractions(redis);
    when(tokens.requireTeam(null)).thenThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED));
    assertThatThrownBy(() -> controller.state(null)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
  }
}
