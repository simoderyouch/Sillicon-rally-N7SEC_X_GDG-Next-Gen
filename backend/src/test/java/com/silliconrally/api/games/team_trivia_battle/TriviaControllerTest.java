package com.silliconrally.api.games.team_trivia_battle;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.silliconrally.api.event.*;
import com.silliconrally.api.mission.*;
import com.silliconrally.api.team.*;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class TriviaControllerTest {
  @Test void usesAuthenticatedTeamAndPublishedMissionAndRejectsClosedEvents() {
    var tokens = mock(SessionTokenService.class); var teams = mock(TeamRepository.class);
    var missions = mock(MissionRepository.class); var event = mock(EventStateService.class); var trivia = mock(TriviaService.class);
    var controller = new TriviaController(tokens, teams, missions, event, trivia);
    var team = new Team("Existing platform team", null);
    var mission = new Mission("team-trivia-battle", "Trivia", "Description", 100, MissionReleaseState.PUBLISHED);
    when(tokens.requireTeam("existing-token")).thenReturn(team.getId());
    when(teams.findById(team.getId())).thenReturn(Optional.of(team));
    when(missions.findBySlug("team-trivia-battle")).thenReturn(Optional.of(mission));
    when(event.get()).thenReturn(new EventDtos.EventStateResponse(true, false));
    controller.start("existing-token", new TriviaController.CategoryRequest("football"));
    verify(trivia).start(team.getId(), mission.getId(), "football");
    controller.state("existing-token"); verify(trivia).state(team.getId(), mission.getId());
    when(event.get()).thenReturn(new EventDtos.EventStateResponse(false, false));
    assertThatThrownBy(() -> controller.answer("existing-token", new TriviaController.AnswerRequest("football-1", 0))).isInstanceOf(ResponseStatusException.class).hasMessageContaining("fermé");
    when(event.get()).thenReturn(new EventDtos.EventStateResponse(true, true));
    assertThatThrownBy(() -> controller.handoff("existing-token")).isInstanceOf(ResponseStatusException.class).hasMessageContaining("verrouillé");
    verify(trivia, never()).answer(any(UUID.class), any(UUID.class), anyString(), anyInt());
    when(missions.findBySlug("team-trivia-battle")).thenReturn(Optional.empty());
    assertThatThrownBy(() -> controller.state("existing-token")).isInstanceOf(ResponseStatusException.class).hasMessageContaining("publiée");
  }
  @Test void rejectsMissingSessionsAndInactiveTeams() {
    var tokens = mock(SessionTokenService.class); var teams = mock(TeamRepository.class);
    var missions = mock(MissionRepository.class); var event = mock(EventStateService.class); var trivia = mock(TriviaService.class);
    var controller = new TriviaController(tokens, teams, missions, event, trivia);
    when(tokens.requireTeam(null)).thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED));
    assertThatThrownBy(() -> controller.state(null)).isInstanceOf(ResponseStatusException.class);
    UUID id = UUID.randomUUID(); when(tokens.requireTeam("expired-team")).thenReturn(id); when(teams.findById(id)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> controller.state("expired-team")).isInstanceOf(ResponseStatusException.class).hasMessageContaining("active");
    verifyNoInteractions(trivia);
  }
}
