package com.silliconrally.api.admin;

import static org.mockito.Mockito.inOrder;

import com.silliconrally.api.event.EventStateService;
import com.silliconrally.api.score.ScoreService;
import com.silliconrally.api.team.SessionTokenService;
import com.silliconrally.api.team.TeamRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

class EventWipeServiceTest {
  @Test
  void removesScoresAndTeamsThenResetsTheEventAndSessions() {
    ScoreService scores = org.mockito.Mockito.mock(ScoreService.class);
    TeamRepository teams = org.mockito.Mockito.mock(TeamRepository.class);
    EventStateService event = org.mockito.Mockito.mock(EventStateService.class);
    SessionTokenService sessions = org.mockito.Mockito.mock(SessionTokenService.class);

    new EventWipeService(scores, teams, event, sessions).wipe();

    InOrder order = inOrder(scores, teams, event, sessions);
    order.verify(scores).resetLeaderboard();
    order.verify(teams).deleteAll();
    order.verify(event).reset();
    order.verify(sessions).revokeAllTeamSessions();
  }
}
