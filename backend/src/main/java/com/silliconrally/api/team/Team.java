package com.silliconrally.api.team;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "teams")
public class Team {
  @Id private UUID id;
  @Column(name = "display_name", nullable = false, unique = true) private String displayName;
  @Column(name = "join_code_hash") private String joinCodeHash;
  @Enumerated(EnumType.STRING) @Column(nullable = false) private TeamStatus status;
  @Column(name = "created_at", nullable = false) private Instant createdAt;

  protected Team() { }
  public Team(String displayName, String joinCodeHash) { this.id = UUID.randomUUID(); this.displayName = displayName; this.joinCodeHash = joinCodeHash; this.status = TeamStatus.ACTIVE; this.createdAt = Instant.now(); }
  public UUID getId() { return id; }
  public String getDisplayName() { return displayName; }
  public String getJoinCodeHash() { return joinCodeHash; }
  public TeamStatus getStatus() { return status; }
  public Instant getCreatedAt() { return createdAt; }
  public void rename(String value) { this.displayName = value; }
  public void setStatus(TeamStatus value) { this.status = value; }
}
