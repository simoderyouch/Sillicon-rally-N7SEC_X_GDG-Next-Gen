package com.silliconrally.api.mission;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ResourceLoader;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registers visible shipped game modules without changing missions that an admin already manages. */
@Service
@Transactional
public class BuiltInGameMissionRegistrar {
  private static final Map<String, GameMission> CURATED_METADATA = Map.of(
      "beacon-bounce", new GameMission("beacon-bounce", "Beacon Bounce", "Memorise an accelerating beacon route and repeat it exactly.", 100),
      "code-breaker", new GameMission("code-breaker", "Code Breaker", "Use deduction clues to crack three fixed code sequences.", 100),
      "cyber-awareness-hub", new GameMission("cyber-awareness-hub", "Phishing Detective — Can You Spot the Threat?", "Analysez 12 e-mails, URL et pages de connexion. Inspectez les détails, identifiez les tentatives de phishing et consultez votre rapport personnalisé.", 100),
      "pacman", new GameMission("pacman", "Pac-Man Challenge", "Collect points, avoid ghosts, and achieve the highest score in five minutes.", 100),
      "password-chaos", new GameMission("password-chaos", "Password Chaos", "Build passwords that satisfy every rule across twenty timed logic challenges.", 100),
      "team-trivia-battle", new GameMission("team-trivia-battle", "Team Trivia Battle", "Choose one category and take on 15 progressively harder questions with 45 seconds each.", 100),
      "word-scramble", new GameMission("word-scramble", "Cyber Word Scramble", "Retrouvez 10 mots anglais de la cybersécurité avec seulement 3 indices partagés entre tous les mots.", 100)
  );

  private final MissionRepository missions;
  private final List<String> gameSlugs;

  @Autowired
  public BuiltInGameMissionRegistrar(MissionRepository missions, ResourceLoader resources) {
    this(missions, readCatalog(resources));
  }

  BuiltInGameMissionRegistrar(MissionRepository missions, List<String> gameSlugs) {
    this.missions = missions;
    this.gameSlugs = List.copyOf(gameSlugs);
  }

  /** Every frontend game folder becomes a published mission unless an admin already manages it. */
  public void registerMissingGames() {
    for (String slug : gameSlugs) {
      GameMission game = CURATED_METADATA.getOrDefault(slug, generatedMetadata(slug));
      if (missions.findBySlug(game.slug()).isEmpty()) {
        missions.save(new Mission(game.slug(), game.title(), game.description(), game.maxScore(), MissionReleaseState.PUBLISHED));
      }
    }
  }

  private static List<String> readCatalog(ResourceLoader resources) {
    try (var input = resources.getResource("classpath:game-catalog.txt").getInputStream()) {
      List<String> slugs = new String(input.readAllBytes(), StandardCharsets.UTF_8).lines()
          .map(String::trim).filter(slug -> slug.matches("[a-z0-9]+(?:-[a-z0-9]+)*")).sorted().distinct().toList();
      if (slugs.isEmpty()) throw new IllegalStateException("The generated game catalog is empty");
      return slugs;
    } catch (IOException exception) {
      throw new IllegalStateException("The generated frontend game catalog is unavailable", exception);
    }
  }

  private static GameMission generatedMetadata(String slug) {
    String title = String.join(" ", java.util.Arrays.stream(slug.split("-"))
        .map(word -> Character.toUpperCase(word.charAt(0)) + word.substring(1)).toList());
    return new GameMission(slug, title, "Complete the " + title + " challenge.", 100);
  }

  record GameMission(String slug, String title, String description, int maxScore) { }
}

@Configuration
class BuiltInGameMissionRegistrationConfiguration {
  @Bean
  ApplicationRunner registerBuiltInGameMissions(BuiltInGameMissionRegistrar registrar) {
    return arguments -> registrar.registerMissingGames();
  }
}
