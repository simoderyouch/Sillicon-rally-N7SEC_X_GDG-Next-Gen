package com.silliconrally.api.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class TeamDtos {
  private TeamDtos() { }
  public record JoinRequest(@NotBlank @Size(max = 60) String teamName, @Size(max = 64) String joinCode) { }
  public record TeamResponse(UUID id, String displayName, TeamStatus status, Instant createdAt) { }
  public record TeamSessionResponse(String token, TeamResponse team) { }
  public record CreateTeamRequest(@NotBlank @Size(max = 60) String displayName, @Size(max = 64) String joinCode) { }
  public record UpdateTeamRequest(@Size(max = 60) String displayName, TeamStatus status) { }
  public static TeamResponse from(Team team) { return new TeamResponse(team.getId(), team.getDisplayName(), team.getStatus(), team.getCreatedAt()); }
}
