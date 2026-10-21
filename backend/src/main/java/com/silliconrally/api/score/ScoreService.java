package com.silliconrally.api.score;

import com.silliconrally.api.event.EventStateService;
import com.silliconrally.api.mission.*;
import com.silliconrally.api.team.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
@Transactional
public class ScoreService {
  private final SessionTokenService tokens; private final TeamRepository teams; private final MissionRepository missions; private final GameScoreRepository scores; private final EventStateService event;
  public ScoreService(SessionTokenService tokens, TeamRepository teams, MissionRepository missions, GameScoreRepository scores, EventStateService event) { this.tokens = tokens; this.teams = teams; this.missions = missions; this.scores = scores; this.event = event; }

  public ScoreDtos.ScoreResponse submit(String teamToken, String slug, ScoreDtos.SubmitScoreRequest request) {
    if (!event.get().isOpen()) throw new ResponseStatusException(FORBIDDEN, "The event is not open");
    if (event.get().leaderboardLocked()) throw new ResponseStatusException(FORBIDDEN, "The leaderboard is locked");
    Team team = teams.findById(tokens.requireTeam(teamToken)).orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Team session is no longer valid"));
    if (team.getStatus() != TeamStatus.ACTIVE) throw new ResponseStatusException(FORBIDDEN, "This team is inactive");
    Mission mission = missions.findBySlug(slug).filter(item -> item.getReleaseState() == MissionReleaseState.PUBLISHED).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Published mission not found"));
    if (request.score() > mission.getMaxScore()) throw new ResponseStatusException(BAD_REQUEST, "Score exceeds this mission maximum");
    GameScore saved = scores.findByTeamAndMission(team, mission).map(existing -> updateIfImproved(existing, request)).orElseGet(() -> scores.save(new GameScore(team, mission, request.score(), request.completed())));
    return ScoreDtos.from(saved);
  }

  private GameScore updateIfImproved(GameScore existing, ScoreDtos.SubmitScoreRequest request) {
    if (request.score() >= existing.getScore()) existing.update(request.score(), request.completed() || existing.isCompleted());
    return existing;
  }

  @Transactional(readOnly = true)
  public List<ScoreDtos.LeaderboardEntry> leaderboard() {
    Map<Team, Integer> totals = new HashMap<>();
    for (GameScore score : scores.findAll()) if (score.getTeam().getStatus() == TeamStatus.ACTIVE) totals.merge(score.getTeam(), score.getScore(), Integer::sum);
    List<Map.Entry<Team, Integer>> ordered = totals.entrySet().stream().sorted(Map.Entry.<Team, Integer>comparingByValue().reversed().thenComparing(entry -> entry.getKey().getCreatedAt())).toList();
    List<ScoreDtos.LeaderboardEntry> leaderboard = new ArrayList<>();
    for (int index = 0; index < ordered.size(); index++) {
      Map.Entry<Team, Integer> entry = ordered.get(index);
      Team team = entry.getKey();
      leaderboard.add(new ScoreDtos.LeaderboardEntry(index + 1, team.getId(), team.getDisplayName(), entry.getValue()));
    }
    return leaderboard;
  }
}
