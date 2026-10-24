package com.silliconrally.api.games.final_flag_challenge;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.silliconrally.api.event.*;
import com.silliconrally.api.mission.*;
import com.silliconrally.api.score.*;
import com.silliconrally.api.team.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.web.server.ResponseStatusException;

class FinalFlagTest {
  @Test void rejectsBlankOversizedAndMalformedBodiesBeforeValidation() throws Exception {
    var flags = mock(FinalFlagService.class);
    var controller = new FinalFlagController(mock(SessionTokenService.class), mock(TeamRepository.class),
        mock(MissionRepository.class), mock(GameScoreRepository.class), mock(EventStateService.class), flags);
    var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(controller).build();
    for (String body : List.of("{\"flag\":\"   \"}", "{\"flag\":\"" + "a".repeat(513) + "\"}", "{")) {
      mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/games/final-flag-challenge/verify")
          .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body))
          .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
    }
    verifyNoInteractions(flags);
  }
  @Test @SuppressWarnings({"unchecked", "rawtypes"}) void validatesPrivatelyTrimsAndNeverSendsTheFlagToRedis() {
    var redis = mock(StringRedisTemplate.class);
    when(redis.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(List.of(0L, 2L, 0L));
    var service = new FinalFlagService(redis, "FLAG{unit-test-secret}", 5, 3000);
    var result = service.verify("mission:team", "  FLAG{unit-test-secret}  ");
    assertThat(result.solved()).isTrue(); assertThat(result.attempts()).isEqualTo(2);
    ArgumentCaptor<Object[]> arguments = ArgumentCaptor.forClass(Object[].class);
    verify(redis).execute(any(RedisScript.class), eq(List.of("mission:team")), arguments.capture());
    assertThat(arguments.getValue()).containsExactly("1", "5", "3000");
    assertThat(result.toString()).doesNotContain("unit-test-secret");
    assertThat(service.verify("mission:team-b", "FLAG{wrong}").solved()).isFalse();
  }
  @Test @SuppressWarnings({"unchecked", "rawtypes"}) void usesTheOrganisersDefaultFlagWhenNoEnvironmentOverrideIsConfigured() {
    var redis = mock(StringRedisTemplate.class);
    when(redis.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(List.of(0L, 1L, 0L));
    var service = new FinalFlagService(redis, "", 0, 3000);
    assertThat(service.verify("key", "N7SEC{lbgh4al_r4jol_l4}").solved()).isTrue();
    assertThat(service.verify("other-key", "FLAG{anything}").solved()).isFalse();
  }
  @Test @SuppressWarnings({"unchecked", "rawtypes"}) void rejectsDuplicateCompletionExhaustionAndRateLimitWithoutReturningAnAnswer() {
    var redis = mock(StringRedisTemplate.class); var service = new FinalFlagService(redis, "test-secret", 3, 3000);
    for (int code = 1; code <= 3; code++) {
      when(redis.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(List.of((long) code, 3L, 1000L));
      int expectedStatus = code == 1 ? 409 : code == 2 ? 403 : 429;
      assertThatThrownBy(() -> service.verify("key", "wrong")).isInstanceOfSatisfying(ResponseStatusException.class,
          e -> { assertThat(e.getStatusCode().value()).isEqualTo(expectedStatus); assertThat(e.getReason()).doesNotContain("test-secret"); });
    }
  }
  @Test void authorizesActualTeamsPublishedMissionAndEventBeforeAnyValidation() {
    var tokens = mock(SessionTokenService.class); var teams = mock(TeamRepository.class);
    var missions = mock(MissionRepository.class); var scores = mock(GameScoreRepository.class);
    var event = mock(EventStateService.class); var flags = mock(FinalFlagService.class);
    var controller = new FinalFlagController(tokens, teams, missions, scores, event, flags);
    var team = new Team("Existing team", null);
    var mission = new Mission("final-flag-challenge", "Final", "", 100, MissionReleaseState.PUBLISHED);
    when(tokens.requireTeam("valid")).thenReturn(team.getId()); when(teams.findById(team.getId())).thenReturn(Optional.of(team));
    when(missions.findBySlug("final-flag-challenge")).thenReturn(Optional.of(mission));
    when(scores.findByTeamAndMission(team, mission)).thenReturn(Optional.empty());
    when(event.get()).thenReturn(new EventDtos.EventStateResponse(false, false));
    assertThatThrownBy(() -> controller.verify("valid", new FinalFlagController.Submission("wrong"))).isInstanceOf(ResponseStatusException.class);
    verifyNoInteractions(flags);
    when(event.get()).thenReturn(new EventDtos.EventStateResponse(true, false));
    controller.verify("valid", new FinalFlagController.Submission("wrong"));
    verify(flags).verify("sillicon-rally:final-flag:v1:" + mission.getId() + ":" + team.getId(), "wrong");
    verify(scores, never()).save(any());
    when(tokens.requireTeam("invalid")).thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED));
    assertThatThrownBy(() -> controller.state("invalid")).isInstanceOf(ResponseStatusException.class);
    when(missions.findBySlug("final-flag-challenge")).thenReturn(Optional.empty());
    assertThatThrownBy(() -> controller.state("valid")).isInstanceOf(ResponseStatusException.class);
  }
}
