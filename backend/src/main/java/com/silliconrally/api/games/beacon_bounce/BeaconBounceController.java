package com.silliconrally.api.games.beacon_bounce;

import com.silliconrally.api.team.SessionTokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

/** Private endpoint: validates Beacon Bounce only; the platform score route remains shared. */
@RestController
@RequestMapping("/api/v1/games/beacon-bounce")
public class BeaconBounceController {
  private final SessionTokenService tokens;
  private final BeaconBounceRunService runs;
  public BeaconBounceController(SessionTokenService tokens, BeaconBounceRunService runs) { this.tokens = tokens; this.runs = runs; }

  public record AttemptRequest(@NotBlank String runId, @Min(0) @Max(5) int round, @NotBlank String beacon) { }
  public record HintRequest(@NotBlank String runId, @Min(0) @Max(5) int round) { }
  @PostMapping("/runs") public BeaconBounceRunService.StartResponse start(@RequestHeader(value = "X-Team-Token", required = false) String token) { return runs.start(tokens.requireTeam(token)); }
  @PostMapping("/attempt") public BeaconBounceRunService.AttemptResponse attempt(@RequestHeader(value = "X-Team-Token", required = false) String token, @Valid @RequestBody AttemptRequest request) { UUID teamId = tokens.requireTeam(token); return runs.attempt(teamId, request.runId(), request.round(), request.beacon()); }
  @PostMapping("/hint") public BeaconBounceRunService.HintResponse hint(@RequestHeader(value = "X-Team-Token", required = false) String token, @Valid @RequestBody HintRequest request) { UUID teamId = tokens.requireTeam(token); return runs.hint(teamId, request.runId(), request.round()); }
}
