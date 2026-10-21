package com.silliconrally.api.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
public final class AdminDtos {
  private AdminDtos() { }
  public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) { }
  public record AdminSessionResponse(String token, String email) { }
}
