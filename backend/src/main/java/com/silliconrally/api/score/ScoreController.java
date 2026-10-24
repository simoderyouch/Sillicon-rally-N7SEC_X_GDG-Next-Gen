package com.silliconrally.api.score;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ScoreController {
  private final ScoreService scores;
  public ScoreController(ScoreService scores) { this.scores = scores; }
  @PostMapping("/games/{slug}/score") public ScoreDtos.ScoreResponse submit(@RequestHeader(value = "X-Team-Token", required = false) String token, @PathVariable String slug, @Valid @RequestBody ScoreDtos.SubmitScoreRequest request) { return scores.submit(token, slug, request); }
  @GetMapping("/my-scores") public List<ScoreDtos.ScoreResponse> myScores(@RequestHeader(value = "X-Team-Token", required = false) String token) { return scores.myScores(token); }
  @GetMapping("/leaderboard") public List<ScoreDtos.LeaderboardEntry> leaderboard() { return scores.leaderboard(); }
}
