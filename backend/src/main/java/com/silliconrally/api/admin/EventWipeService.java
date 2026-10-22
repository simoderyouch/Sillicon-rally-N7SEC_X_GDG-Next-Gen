package com.silliconrally.api.admin;

import com.silliconrally.api.event.EventStateService;
import com.silliconrally.api.score.ScoreService;
import com.silliconrally.api.team.SessionTokenService;
import com.silliconrally.api.team.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EventWipeService {
  private final ScoreService scores;
  private final TeamRepository teams;
  private final EventStateService event;
  private final SessionTokenService sessions;

  public EventWipeService(ScoreService scores, TeamRepository teams, EventStateService event, SessionTokenService sessions) {
    this.scores = scores;
    this.teams = teams;
    this.event = event;
    this.sessions = sessions;
  }

  public void wipe() {
    scores.resetLeaderboard();
    teams.deleteAll();
    event.reset();
    sessions.revokeAllTeamSessions();
  }
}
