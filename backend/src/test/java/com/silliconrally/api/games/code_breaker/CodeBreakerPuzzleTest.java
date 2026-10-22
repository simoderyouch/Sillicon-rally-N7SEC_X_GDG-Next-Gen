package com.silliconrally.api.games.code_breaker;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class CodeBreakerPuzzleTest {
  private final CodeBreakerPuzzle puzzle = new CodeBreakerPuzzle();

  @Test
  void generates_a_stable_but_team_specific_code() {
    UUID firstTeam = UUID.fromString("11111111-1111-1111-1111-111111111111");
    UUID secondTeam = UUID.fromString("22222222-2222-2222-2222-222222222222");

    assertEquals(puzzle.answerFor(firstTeam, 2), puzzle.answerFor(firstTeam, 2));
    assertNotEquals(puzzle.answerFor(firstTeam, 2), puzzle.answerFor(secondTeam, 2));
  }

  @Test
  void distinguishes_exact_shifted_and_absent_symbols() {
    CodeBreakerPuzzle.Feedback feedback = puzzle.evaluate(List.of("comet", "spark", "leaf"), List.of("comet", "orbit", "spark"));

    assertEquals(1, feedback.exact());
    assertEquals(1, feedback.shifted());
    assertEquals(1, feedback.absent());
  }
}
