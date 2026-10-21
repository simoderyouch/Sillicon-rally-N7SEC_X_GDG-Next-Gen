package com.silliconrally.api.score;

import com.silliconrally.api.mission.Mission;
import com.silliconrally.api.team.Team;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "game_scores", uniqueConstraints = @UniqueConstraint(name = "game_scores_team_mission_unique", columnNames = {"team_id", "mission_id"}))
public class GameScore {
  @Id private UUID id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "team_id", nullable = false) private Team team;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "mission_id", nullable = false) private Mission mission;
  @Column(nullable = false) private int score;
  @Column(nullable = false) private boolean completed;
  @Column(name = "submitted_at", nullable = false) private Instant submittedAt;

  protected GameScore() { }
  public GameScore(Team team, Mission mission, int score, boolean completed) { this.id = UUID.randomUUID(); this.team = team; this.mission = mission; update(score, completed); }
  public Team getTeam() { return team; } public Mission getMission() { return mission; } public int getScore() { return score; } public boolean isCompleted() { return completed; } public Instant getSubmittedAt() { return submittedAt; }
  public void update(int score, boolean completed) { this.score = score; this.completed = completed; this.submittedAt = Instant.now(); }
}
