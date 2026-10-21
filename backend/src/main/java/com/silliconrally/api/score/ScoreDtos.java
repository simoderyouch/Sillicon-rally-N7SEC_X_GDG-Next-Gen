package com.silliconrally.api.score;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public final class ScoreDtos {
  private ScoreDtos() { }
  public record SubmitScoreRequest(@NotNull @Min(0) Integer score, boolean completed, Map<String, Object> details) { }
  public record ScoreResponse(String missionSlug, int score, boolean completed, Instant submittedAt) { }
  public record LeaderboardEntry(int rank, UUID teamId, String teamName, int score) { }
  public static ScoreResponse from(GameScore score) { return new ScoreResponse(score.getMission().getSlug(), score.getScore(), score.isCompleted(), score.getSubmittedAt()); }
}
