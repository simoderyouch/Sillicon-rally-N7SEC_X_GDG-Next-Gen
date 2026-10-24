package com.silliconrally.api.event;

import jakarta.persistence.*;

@Entity
@Table(name = "event_state")
public class EventState {
  @Id private Long id;
  @Column(name = "is_open", nullable = false) private boolean open;
  @Column(name = "leaderboard_locked", nullable = false) private boolean leaderboardLocked;
  @Column(name = "team_join_code_hash", length = 100) private String teamJoinCodeHash;
  protected EventState() { }
  public boolean isOpen() { return open; }
  public boolean isLeaderboardLocked() { return leaderboardLocked; }
  public String getTeamJoinCodeHash() { return teamJoinCodeHash; }
  public void update(Boolean open, Boolean leaderboardLocked) { if (open != null) this.open = open; if (leaderboardLocked != null) this.leaderboardLocked = leaderboardLocked; }
  public void setTeamJoinCodeHash(String hash) { this.teamJoinCodeHash = hash; }
}
