package com.silliconrally.api.score;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import com.silliconrally.api.event.EventStateService;
import com.silliconrally.api.mission.MissionRepository;
import com.silliconrally.api.team.SessionTokenService;
import com.silliconrally.api.team.TeamRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

class ScoreServiceTest {
  @Test
  void resetRemovesScoresAndBroadcastsAnEmptyLeaderboard() {
    GameScoreRepository scores = org.mockito.Mockito.mock(GameScoreRepository.class);
    ApplicationEventPublisher events = org.mockito.Mockito.mock(ApplicationEventPublisher.class);
    ScoreService service = new ScoreService(
        org.mockito.Mockito.mock(SessionTokenService.class),
        org.mockito.Mockito.mock(TeamRepository.class),
        org.mockito.Mockito.mock(MissionRepository.class),
        scores,
        org.mockito.Mockito.mock(EventStateService.class),
        events);

    service.resetLeaderboard();

    verify(scores).deleteAll();
    ArgumentCaptor<LeaderboardUpdatedEvent> event = ArgumentCaptor.forClass(LeaderboardUpdatedEvent.class);
    verify(events).publishEvent(event.capture());
    assertThat(event.getValue().entries()).isEmpty();
  }
}
