package com.silliconrally.api.games.code_breaker;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;
import com.silliconrally.api.team.SessionTokenService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/** Private Code Breaker endpoint. It validates only this game's team-specific puzzle. */
@RestController
@RequestMapping("/api/v1/games/code-breaker")
public class CodeBreakerController {
  private final SessionTokenService tokens;
  private final CodeBreakerPuzzle puzzle = new CodeBreakerPuzzle();

  public CodeBreakerController(SessionTokenService tokens) { this.tokens = tokens; }

  public record AttemptRequest(@Min(0) @Max(2) int round, @NotEmpty List<@NotBlank String> symbols) { }
  public record AttemptResponse(int exact, int shifted, int absent, boolean correct) { }
  public record HintResponse(int position, String symbol) { }

  @PostMapping("/attempt")
  public AttemptResponse attempt(@RequestHeader(value = "X-Team-Token", required = false) String token, @Valid @RequestBody AttemptRequest request) {
    UUID teamId = tokens.requireTeam(token);
    List<String> answer = puzzle.answerFor(teamId, request.round());
    CodeBreakerPuzzle.Feedback feedback = puzzle.evaluate(request.symbols(), answer);
    return new AttemptResponse(feedback.exact(), feedback.shifted(), feedback.absent(), feedback.exact() == answer.size());
  }

  @GetMapping("/hint")
  public HintResponse hint(@RequestHeader(value = "X-Team-Token", required = false) String token, @RequestParam @Min(0) @Max(2) int round, @RequestParam @Min(0) int position) {
    UUID teamId = tokens.requireTeam(token);
    List<String> answer = puzzle.answerFor(teamId, round);
    if (position < 0 || position >= answer.size()) throw new ResponseStatusException(BAD_REQUEST, "This position is outside the code");
    return new HintResponse(position, answer.get(position));
  }
}
