package com.silliconrally.api.mission;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "missions")
public class Mission {
  @Id private UUID id;
  @Column(nullable = false, unique = true) private String slug;
  @Column(nullable = false) private String title;
  @Column(nullable = false, length = 1000) private String description;
  @Column(name = "max_score", nullable = false) private int maxScore;
  @Enumerated(EnumType.STRING) @Column(name = "release_state", nullable = false) private MissionReleaseState releaseState;
  protected Mission() { }
  public UUID getId() { return id; } public String getSlug() { return slug; } public String getTitle() { return title; } public String getDescription() { return description; } public int getMaxScore() { return maxScore; } public MissionReleaseState getReleaseState() { return releaseState; }
}
