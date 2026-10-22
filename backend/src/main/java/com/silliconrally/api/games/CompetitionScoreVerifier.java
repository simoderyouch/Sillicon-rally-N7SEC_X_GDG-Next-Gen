package com.silliconrally.api.games;

import com.silliconrally.api.games.beacon_bounce.BeaconBounceRunService;
import com.silliconrally.api.games.code_breaker.CodeBreakerRunService;
import com.silliconrally.api.score.ScoreDtos;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

/** Bridges private game state to the shared score route without exposing game rules there. */
@Service
public class CompetitionScoreVerifier {
  private final BeaconBounceRunService beaconBounce;
  private final CodeBreakerRunService codeBreaker;

  public CompetitionScoreVerifier(BeaconBounceRunService beaconBounce, CodeBreakerRunService codeBreaker) {
    this.beaconBounce = beaconBounce;
    this.codeBreaker = codeBreaker;
  }

  public void verify(UUID teamId, String slug, ScoreDtos.SubmitScoreRequest submitted) {
    if ("beacon-bounce".equals(slug)) {
      BeaconBounceRunService.VerifiedResult result = beaconBounce.verifiedResult(teamId);
      matches(result.score(), result.completed(), submitted);
    } else if ("code-breaker".equals(slug)) {
      CodeBreakerRunService.VerifiedResult result = codeBreaker.verifiedResult(teamId);
      matches(result.score(), result.completed(), submitted);
    }
  }

  private void matches(int score, boolean completed, ScoreDtos.SubmitScoreRequest submitted) {
    if (submitted.score() != score || submitted.completed() != completed) {
      throw new ResponseStatusException(BAD_REQUEST, "Submitted score does not match the verified competition result");
    }
  }
}
