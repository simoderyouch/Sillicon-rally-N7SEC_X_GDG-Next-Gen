package com.silliconrally.api.event;

import jakarta.persistence.*;

@Entity
@Table(name = "event_state")
public class EventState {
  @Id private Long id;
  @Column(name = "is_open", nullable = false) private boolean open;
  @Column(name = "leaderboard_locked", nullable = false) private boolean leaderboardLocked;
  protected EventState() { }
  public boolean isOpen() { return open; }
  public boolean isLeaderboardLocked() { return leaderboardLocked; }
  public void update(Boolean open, Boolean leaderboardLocked) { if (open != null) this.open = open; if (leaderboardLocked != null) this.leaderboardLocked = leaderboardLocked; }
}
