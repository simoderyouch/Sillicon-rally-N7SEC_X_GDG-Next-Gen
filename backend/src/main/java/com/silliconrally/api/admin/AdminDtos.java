package com.silliconrally.api.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public final class AdminDtos {
  private AdminDtos() { }
  public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) { }
  public record AdminSessionResponse(String token, String email) { }
  public record UpdateTeamJoinCodeRequest(@NotBlank @Size(min = 4, max = 64) String joinCode) { }
}
