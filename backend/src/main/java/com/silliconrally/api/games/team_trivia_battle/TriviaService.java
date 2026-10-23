package com.silliconrally.api.games.team_trivia_battle;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import java.util.function.UnaryOperator;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class TriviaService {
  // One persistent run per actual team + mission. No expiry that could grant another attempt.
  private static final String PREFIX = "sillicon-rally:team-trivia-battle:v1:";
  private static final DefaultRedisScript<Long> CAS = new DefaultRedisScript<>("""
    local current = redis.call('GET', KEYS[1])
    if (not current and ARGV[1] == '') or current == ARGV[1] then
      redis.call('SET', KEYS[1], ARGV[2])
      return 1
    end
    return 0
    """, Long.class);
  private final StringRedisTemplate redis;
  private final ObjectMapper json;
  private final QuizEngine engine = new QuizEngine(new QuestionBank());
  public TriviaService(StringRedisTemplate redis, ObjectMapper json) { this.redis = redis; this.json = json; }
  public QuizEngine.Snapshot state(UUID team, UUID mission) { return change(team, mission, run -> run); }
  public QuizEngine.Snapshot start(UUID team, UUID mission, String category) {
    return change(team, mission, run -> {
      if (run != null && !run.category().equals(category)) throw new ResponseStatusException(CONFLICT, "La catégorie est déjà verrouillée pour cette mission");
      return run == null ? engine.start(category, System.currentTimeMillis()) : run;
    });
  }
  public QuizEngine.Snapshot answer(UUID team, UUID mission, String question, int option) {
    return change(team, mission, run -> {
      if (run == null) throw new ResponseStatusException(CONFLICT, "Choisissez une catégorie avant de jouer");
      return engine.answer(run, question, option, System.currentTimeMillis());
    });
  }
  public QuizEngine.Snapshot handoff(UUID team, UUID mission) {
    return change(team, mission, run -> {
      if (run == null || run.answers().size() != 15) throw new ResponseStatusException(CONFLICT, "Terminez les 15 questions avant de transmettre le résultat");
      if (run.handedOff()) throw new ResponseStatusException(CONFLICT, "Le résultat de cette partie a déjà été transmis");
      return new QuizEngine.Run(run.category(), run.cards(), run.answers(), run.startedAt(), run.deadline(), true);
    });
  }
  private QuizEngine.Snapshot change(UUID team, UUID mission, UnaryOperator<QuizEngine.Run> operation) {
    String key = PREFIX + mission + ":" + team;
    for (int attempt = 0; attempt < 12; attempt++) {
      String stored = redis.opsForValue().get(key);
      QuizEngine.Run run = stored == null ? null : read(stored);
      long now = System.currentTimeMillis();
      if (run != null) run = engine.catchUp(run, now);
      try { run = operation.apply(run); }
      catch (IllegalArgumentException exception) { throw new ResponseStatusException(BAD_REQUEST, exception.getMessage()); }
      if (run == null) return null;
      String next = write(run);
      if (next.equals(stored) || Long.valueOf(1).equals(redis.execute(CAS, List.of(key), stored == null ? "" : stored, next))) return engine.snapshot(run, System.currentTimeMillis());
    }
    throw new ResponseStatusException(CONFLICT, "Une autre action est en cours. Rechargez la partie.");
  }
  private QuizEngine.Run read(String value) { try { return json.readValue(value, QuizEngine.Run.class); } catch (JsonProcessingException exception) { throw new IllegalStateException("Invalid trivia state", exception); } }
  private String write(QuizEngine.Run run) { try { return json.writeValueAsString(run); } catch (JsonProcessingException exception) { throw new IllegalStateException("Cannot save trivia state", exception); } }
}
