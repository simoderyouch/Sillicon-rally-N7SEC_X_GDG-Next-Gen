package com.silliconrally.api.mission;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class MissionDtos {
  private MissionDtos() { }
  public record UpsertRequest(@NotBlank @Pattern(regexp = "[a-z0-9-]+") @Size(max = 80) String slug, @NotBlank @Size(max = 120) String title, @NotBlank @Size(max = 1000) String description, @NotNull @Min(0) @Max(10000) Integer maxScore, @NotNull MissionReleaseState releaseState) { }
  public record MissionResponse(UUID id, String slug, String title, String description, int maxScore, MissionReleaseState releaseState) { }
  public static MissionResponse from(Mission mission) { return new MissionResponse(mission.getId(), mission.getSlug(), mission.getTitle(), mission.getDescription(), mission.getMaxScore(), mission.getReleaseState()); }
}
