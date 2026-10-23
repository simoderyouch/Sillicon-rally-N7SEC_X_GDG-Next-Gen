package com.silliconrally.api.mission;

import java.util.List;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registers shipped game modules without changing missions that an admin already manages. */
@Service
@Transactional
public class BuiltInGameMissionRegistrar {
  private static final List<GameMission> BUILT_IN_GAMES = List.of(
      new GameMission("intake", "Mission Intake", "Triage a suspicious message and choose the safest response.", 100),
      new GameMission("beacon-bounce", "Beacon Bounce", "Memorise an accelerating beacon route and repeat it exactly.", 100),
      new GameMission("code-breaker", "Code Breaker", "Use deduction clues to crack three team-specific code sequences.", 100),
      new GameMission("parcel-panic", "Parcel Panic", "Route every incoming parcel to the delivery depot with the matching stamp.", 100),
      new GameMission("cyber-awareness-hub", "Phishing Detective — Can You Spot the Threat?", "Analysez 12 e-mails, URL et pages de connexion. Inspectez les détails, identifiez les tentatives de phishing et consultez votre rapport personnalisé.", 100),
      new GameMission("pacman", "Pac-Man Challenge", "Collect points, avoid ghosts, and achieve the highest score in five minutes.", 100),
      new GameMission("word-scramble", "Cyber Word Scramble", "Retrouvez 10 mots anglais de la cybersécurité avec seulement 3 indices partagés entre tous les mots.", 100)
  );

  private final MissionRepository missions;

  public BuiltInGameMissionRegistrar(MissionRepository missions) {
    this.missions = missions;
  }

  /** Missing built-in games are added as drafts; existing manual release settings always win. */
  public void registerMissingGames() {
    for (GameMission game : BUILT_IN_GAMES) {
      if (missions.findBySlug(game.slug()).isEmpty()) {
        missions.save(new Mission(game.slug(), game.title(), game.description(), game.maxScore(), MissionReleaseState.DRAFT));
      }
    }
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
