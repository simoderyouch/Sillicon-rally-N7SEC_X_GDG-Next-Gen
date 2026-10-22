package com.silliconrally.api.games.code_breaker;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;
import com.silliconrally.api.team.SessionTokenService;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/** Private, server-authoritative Code Breaker competition endpoints. */
@RestController
@RequestMapping("/api/v1/games/code-breaker")
public class CodeBreakerController {
  private final SessionTokenService tokens;
  private final CodeBreakerRunService runs;

  public CodeBreakerController(SessionTokenService tokens, CodeBreakerRunService runs) { this.tokens = tokens; this.runs = runs; }

  public record AttemptRequest(@Min(0) @Max(2) int round, @NotEmpty List<@NotBlank String> symbols) { }
  @PostMapping("/runs")
  public CodeBreakerRunService.StartResponse start(@RequestHeader(value = "X-Team-Token", required = false) String token) {
    return runs.start(tokens.requireTeam(token));
  }

  @PostMapping("/attempt")
  public CodeBreakerRunService.AttemptResponse attempt(@RequestHeader(value = "X-Team-Token", required = false) String token, @Valid @RequestBody AttemptRequest request) {
    UUID teamId = tokens.requireTeam(token);
    return runs.attempt(teamId, request.round(), request.symbols());
  }

  @PostMapping("/hint")
  public CodeBreakerRunService.HintResponse hint(@RequestHeader(value = "X-Team-Token", required = false) String token, @RequestParam @Min(0) @Max(2) int round, @RequestParam @Min(0) int position) {
    UUID teamId = tokens.requireTeam(token);
    return runs.hint(teamId, round, position);
  }
}
