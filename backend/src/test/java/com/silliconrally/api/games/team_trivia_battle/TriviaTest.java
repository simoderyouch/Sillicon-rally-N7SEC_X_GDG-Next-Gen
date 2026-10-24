package com.silliconrally.api.games.team_trivia_battle;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;

class TriviaTest {
  final QuestionBank bank = new QuestionBank();
  final QuizEngine engine = new QuizEngine(bank);
  @Test void bankHas240UniqueUnambiguousQuestionsAndDrawsFiveOfEachDifficulty() {
    assertThat(bank.all()).hasSize(240);
    assertThat(bank.all().stream().map(QuestionBank.Question::text).distinct()).hasSize(240);
    for (String category : QuestionBank.CATEGORIES) {
      assertThat(bank.all().stream().filter(q -> q.category().equals(category))).hasSize(40);
      for (int repeat = 0; repeat < 20; repeat++) {
        var drawn = bank.draw(category);
        assertThat(drawn).hasSize(15);
        assertThat(drawn.stream().map(QuestionBank.Question::id).distinct()).hasSize(15);
        assertThat(drawn.subList(0, 5)).allMatch(q -> q.difficulty().equals("easy"));
        assertThat(drawn.subList(5, 10)).allMatch(q -> q.difficulty().equals("medium"));
        assertThat(drawn.subList(10, 15)).allMatch(q -> q.difficulty().equals("challenging"));
        drawn.forEach(q -> { assertThat(new HashSet<>(q.options())).hasSize(4); assertThat(q.explanation()).isNotBlank(); });
      }
    }
  }
  @Test void noAnswerOrFutureQuestionIsExposedBeforeValidation() throws Exception {
    var run = engine.start("it", 1000);
    var snapshot = engine.snapshot(run, 1000);
    String json = new ObjectMapper().writeValueAsString(snapshot);
    assertThat(snapshot.deadline()).isEqualTo(46000);
    assertThat(snapshot.question().options()).hasSize(4);
    assertThat(snapshot.review()).isEmpty(); assertThat(snapshot.feedback()).isNull();
    assertThat(json).doesNotContain("correctOption", "explanation", "cards", "order");
    assertThatThrownBy(() -> engine.answer(run, run.cards().get(1).questionId(), 0, 1001)).isInstanceOf(IllegalArgumentException.class);
  }
  @Test void deadlineSurvivesReopeningAndLateAnswerBecomesATimeout() {
    var run = engine.start("football", 0);
    assertThat(engine.snapshot(run, 20000).deadline()).isEqualTo(45000);
    var atDeadline = engine.answer(run, run.cards().get(0).questionId(), run.cards().get(0).order().indexOf(0), 45000);
    var snapshot = engine.snapshot(atDeadline, 45000);
    assertThat(snapshot.timeouts()).isEqualTo(1); assertThat(snapshot.rawScore()).isZero();
    assertThat(snapshot.feedback().timeout()).isTrue();
    assertThat(atDeadline.deadline()).isEqualTo(91800);
    assertThatThrownBy(() -> engine.answer(atDeadline, run.cards().get(1).questionId(), 0, 46000)).isInstanceOf(IllegalArgumentException.class);
    assertThat(engine.snapshot(engine.catchUp(run, 10000000), 10000000).timeouts()).isEqualTo(15);
  }
  @Test void locksAnswersAndGivesFeedbackBeforeAdvancingAutomatically() {
    var run = engine.start("movies", 0); var first = run.cards().get(0);
    run = engine.answer(run, first.questionId(), first.order().indexOf(0), 1000);
    var duplicate = engine.answer(run, first.questionId(), (first.order().indexOf(0) + 1) % 4, 1001);
    assertThat(duplicate).isEqualTo(run);
    assertThat(engine.snapshot(run, 2000).feedback().correct()).isTrue();
    assertThat(engine.snapshot(run, 2799).number()).isEqualTo(1);
    assertThat(engine.snapshot(run, 2800).number()).isEqualTo(2);
    assertThat(engine.snapshot(run, 2800).feedback()).isNull();
    assertThat(engine.snapshot(run, 2800).deadline() - 2800).isEqualTo(45000);
  }
  @Test void scoringAndRanksCoverAllResultsWithoutSpeedBonus() {
    for (int correct = 0; correct <= 15; correct++) {
      var run = engine.start("cybersecurity", 0);
      for (int i = 0; i < 15; i++) {
        var card = run.cards().get(i); int right = card.order().indexOf(0);
        long at = run.deadline() - 40000;
        run = engine.answer(run, card.questionId(), i < correct ? right : (right + 1) % 4, at);
      }
      var result = engine.snapshot(run, run.deadline());
      assertThat(result.complete()).isTrue(); assertThat(result.rawScore()).isEqualTo(correct * 10);
      assertThat(result.score()).isEqualTo((int) Math.round(correct * 100.0 / 15));
      assertThat(result.review()).hasSize(15); assertThat(result.totalTimeMs()).isEqualTo(75000);
      assertThat(result.incorrectAnswers()).isEqualTo(15 - correct); assertThat(result.timeouts()).isZero();
      assertThat(result.rank()).isEqualTo(correct >= 13 ? "Trivia Master" : correct >= 10 ? "Knowledge Expert" : correct >= 7 ? "Rising Challenger" : "Keep Learning");
    }
  }
  @Test @SuppressWarnings({"unchecked", "rawtypes"}) void redisScopesTeamsLocksCategoryAndAllowsOnlyOneHandoff() throws Exception {
    StringRedisTemplate redis = mock(StringRedisTemplate.class);
    ValueOperations<String, String> values = mock(ValueOperations.class);
    Map<String, String> database = new HashMap<>();
    when(redis.opsForValue()).thenReturn(values);
    when(values.get(anyString())).thenAnswer(call -> database.get(call.getArgument(0)));
    when(redis.execute(any(RedisScript.class), anyList(), any(), any())).thenAnswer(call -> {
      String key = ((List<String>) call.getArgument(1)).get(0);
      String before = call.getArgument(2), after = call.getArgument(3);
      if (!Objects.equals(database.getOrDefault(key, ""), before)) return 0L;
      database.put(key, after); return 1L;
    });
    ObjectMapper json = new ObjectMapper(); var service = new TriviaService(redis, json);
    UUID teamA = UUID.randomUUID(), teamB = UUID.randomUUID(), mission = UUID.randomUUID();
    assertThat(service.state(teamA, mission)).isNull();
    var first = service.start(teamA, mission, "it");
    assertThat(service.start(teamA, mission, "it").question()).isEqualTo(first.question());
    assertThatThrownBy(() -> service.start(teamA, mission, "movies")).hasMessageContaining("verrouillée");
    assertThat(service.start(teamB, mission, "movies").category()).isEqualTo("movies");
    assertThat(service.state(teamA, mission).category()).isEqualTo("it");
    assertThatThrownBy(() -> service.handoff(teamA, mission)).hasMessageContaining("15 questions");
    String key = database.keySet().stream().filter(k -> k.endsWith(teamA.toString())).findFirst().orElseThrow();
    var run = json.readValue(database.get(key), QuizEngine.Run.class);
    var finished = engine.catchUp(run, run.startedAt() + 10000000);
    database.put(key, json.writeValueAsString(finished));
    assertThat(service.handoff(teamA, mission).handedOff()).isTrue();
    assertThatThrownBy(() -> service.handoff(teamA, mission)).hasMessageContaining("déjà été transmis");
    assertThat(service.start(teamA, mission, "it").complete()).isTrue();
    assertThat(service.state(teamB, mission).complete()).isFalse();
    assertThat(service.state(teamA, UUID.randomUUID())).isNull();
  }
}
