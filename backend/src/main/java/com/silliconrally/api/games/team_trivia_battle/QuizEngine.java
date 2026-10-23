package com.silliconrally.api.games.team_trivia_battle;

import java.util.*;

public final class QuizEngine {
  public static final long QUESTION_MS = 45000, FEEDBACK_MS = 1800;
  public record Card(String questionId, List<Integer> order) { }
  public record Answer(String questionId, Integer selected, boolean correct, boolean timeout, long elapsedMs, long answeredAt) { }
  public record Run(String category, List<Card> cards, List<Answer> answers, long startedAt, long deadline, boolean handedOff) { }
  public record PublicQuestion(String id, String text, List<String> options, String difficulty) { }
  public record Review(PublicQuestion question, Integer selected, int correctOption, boolean correct, boolean timeout, String explanation) { }
  public record Snapshot(String category, int number, int answered, int rawScore, int score, int correctAnswers, int incorrectAnswers, int timeouts, long totalTimeMs, String rank, long serverNow, long deadline, long nextAt, boolean complete, boolean handedOff, PublicQuestion question, Review feedback, List<Review> review) { }
  private final QuestionBank bank;
  public QuizEngine(QuestionBank bank) { this.bank = bank; }
  public Run start(String category, long now) {
    if (!QuestionBank.CATEGORIES.contains(category)) throw new IllegalArgumentException("Catégorie inconnue");
    List<Card> cards = bank.draw(category).stream().map(q -> {
      List<Integer> order = new ArrayList<>(List.of(0, 1, 2, 3)); Collections.shuffle(order);
      return new Card(q.id(), List.copyOf(order));
    }).toList();
    return new Run(category, cards, List.of(), now, now + QUESTION_MS, false);
  }
  public Run catchUp(Run run, long now) {
    while (run.answers().size() < 15 && now >= run.deadline()) run = append(run, null, true, run.deadline());
    return run;
  }
  public Run answer(Run run, String questionId, int option, long now) {
    run = catchUp(run, now);
    if (run.answers().stream().anyMatch(a -> a.questionId().equals(questionId))) return run;
    if (run.answers().size() == 15 || run.handedOff()) throw new IllegalArgumentException("Cette partie est terminée");
    if (option < 0 || option > 3) throw new IllegalArgumentException("Réponse invalide");
    Card card = run.cards().get(run.answers().size());
    if (!card.questionId().equals(questionId)) throw new IllegalArgumentException("Cette question n'est pas active");
    if (now < run.deadline() - QUESTION_MS) throw new IllegalArgumentException("La question suivante n'est pas encore ouverte");
    return append(run, option, false, now);
  }
  private Run append(Run run, Integer selected, boolean timeout, long at) {
    Card card = run.cards().get(run.answers().size());
    boolean correct = selected != null && card.order().get(selected) == 0;
    List<Answer> answers = new ArrayList<>(run.answers());
    answers.add(new Answer(card.questionId(), selected, correct, timeout, timeout ? QUESTION_MS : Math.max(0, Math.min(QUESTION_MS, at - (run.deadline() - QUESTION_MS))), at));
    return new Run(run.category(), run.cards(), List.copyOf(answers), run.startedAt(), at + FEEDBACK_MS + QUESTION_MS, run.handedOff());
  }
  public Snapshot snapshot(Run run, long now) {
    int count = run.answers().size(); boolean complete = count == 15;
    int correct = (int) run.answers().stream().filter(Answer::correct).count();
    int timeouts = (int) run.answers().stream().filter(Answer::timeout).count();
    int index = Math.min(count, 14);
    long nextAt = count == 0 ? 0 : run.answers().get(count - 1).answeredAt() + FEEDBACK_MS;
    boolean showingFeedback = count > 0 && now < nextAt && !complete;
    if (showingFeedback) index = count - 1;
    Review feedback = showingFeedback ? review(run.cards().get(index), run.answers().get(index)) : null;
    List<Review> reviews = new ArrayList<>();
    if (complete) for (int i = 0; i < 15; i++) reviews.add(review(run.cards().get(i), run.answers().get(i)));
    return new Snapshot(run.category(), index + 1, count, correct * 10, (int) Math.round(correct * 100.0 / 15), correct, count - correct - timeouts, timeouts,
      run.answers().stream().mapToLong(Answer::elapsedMs).sum(), correct >= 13 ? "Trivia Master" : correct >= 10 ? "Knowledge Expert" : correct >= 7 ? "Rising Challenger" : "Keep Learning",
      now, run.deadline(), showingFeedback ? nextAt : 0, complete, run.handedOff(), complete ? null : publicQuestion(run.cards().get(index)), feedback, List.copyOf(reviews));
  }
  private PublicQuestion publicQuestion(Card card) {
    var q = bank.get(card.questionId());
    return new PublicQuestion(q.id(), q.text(), card.order().stream().map(q.options()::get).toList(), q.difficulty());
  }
  private Review review(Card card, Answer answer) {
    return new Review(publicQuestion(card), answer.selected(), card.order().indexOf(0), answer.correct(), answer.timeout(), bank.get(card.questionId()).explanation());
  }
}
