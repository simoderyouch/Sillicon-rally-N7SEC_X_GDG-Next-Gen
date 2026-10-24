package com.silliconrally.api.games.code_breaker;

import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CodeBreakerPuzzleTest {
  private final CodeBreakerPuzzle puzzle = new CodeBreakerPuzzle();

  @Test
  void exposes_the_fixed_code_for_each_round() {
    assertEquals(List.of("comet", "orbit", "spark"), puzzle.answerFor(0));
    assertEquals(List.of("spark", "moon", "orbit"), puzzle.answerFor(1));
    assertEquals(List.of("moon", "bolt", "moon", "leaf", "orbit"), puzzle.answerFor(2));
  }

  @Test
  void distinguishes_exact_shifted_and_absent_symbols() {
    CodeBreakerPuzzle.Feedback feedback = puzzle.evaluate(List.of("comet", "spark", "leaf"), List.of("comet", "orbit", "spark"));

    assertEquals(1, feedback.exact());
    assertEquals(1, feedback.shifted());
    assertEquals(1, feedback.absent());
  }
}
