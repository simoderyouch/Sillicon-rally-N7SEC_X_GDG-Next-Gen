package com.silliconrally.api.games.code_breaker;

import java.util.ArrayList;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/** Stateless fixed puzzle. No answer is sent to the browser. */
public final class CodeBreakerPuzzle {
  private static final List<String> SYMBOLS = List.of("comet", "orbit", "spark", "leaf", "wave", "cube", "moon", "bolt");
  private static final int[] LENGTHS = {3, 3, 5};
  private static final List<List<String>> ANSWERS = List.of(
    List.of("comet", "orbit", "spark"),
    List.of("spark", "moon", "orbit"),
    List.of("moon", "bolt", "moon", "leaf", "orbit")
  );

  public record Feedback(int exact, int shifted, int absent) { }

  public List<String> answerFor(int round) {
    lengthFor(round);
    return ANSWERS.get(round);
  }

  public Feedback evaluate(List<String> guess, List<String> answer) {
    if (guess.size() != answer.size()) throw new ResponseStatusException(BAD_REQUEST, "This code needs " + answer.size() + " symbols");
    if (!SYMBOLS.containsAll(guess)) throw new ResponseStatusException(BAD_REQUEST, "The sequence contains an unknown symbol");

    int exact = 0;
    List<String> unmatchedGuess = new ArrayList<>();
    List<String> unmatchedAnswer = new ArrayList<>();
    for (int index = 0; index < answer.size(); index += 1) {
      if (guess.get(index).equals(answer.get(index))) exact += 1;
      else {
        unmatchedGuess.add(guess.get(index));
        unmatchedAnswer.add(answer.get(index));
      }
    }

    int shifted = 0;
    for (String symbol : unmatchedGuess) {
      int index = unmatchedAnswer.indexOf(symbol);
      if (index >= 0) {
        shifted += 1;
        unmatchedAnswer.remove(index);
      }
    }
    return new Feedback(exact, shifted, guess.size() - exact - shifted);
  }

  public int lengthFor(int round) {
    if (round < 0 || round >= LENGTHS.length) throw new ResponseStatusException(BAD_REQUEST, "Unknown Code Breaker round");
    return LENGTHS[round];
  }
}
