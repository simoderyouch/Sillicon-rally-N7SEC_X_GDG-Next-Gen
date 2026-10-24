package com.silliconrally.api.mission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class BuiltInGameMissionRegistrarTest {
  private final MissionRepository missions = org.mockito.Mockito.mock(MissionRepository.class);
  private final BuiltInGameMissionRegistrar registrar = new BuiltInGameMissionRegistrar(missions, List.of(
      "beacon-bounce", "code-breaker", "cyber-awareness-hub", "pacman", "password-chaos", "team-trivia-battle", "word-scramble"));

  @Test
  void addsEveryMissingBuiltInGameAsPublished() {
    when(missions.findBySlug(any())).thenReturn(Optional.empty());
    ArgumentCaptor<Mission> saved = ArgumentCaptor.forClass(Mission.class);

    registrar.registerMissingGames();

    verify(missions, org.mockito.Mockito.times(7)).save(saved.capture());
    assertThat(saved.getAllValues())
        .extracting(Mission::getSlug, Mission::getTitle, Mission::getMaxScore, Mission::getReleaseState)
        .containsExactlyInAnyOrder(
            org.assertj.core.groups.Tuple.tuple("beacon-bounce", "Beacon Bounce", 100, MissionReleaseState.PUBLISHED),
            org.assertj.core.groups.Tuple.tuple("code-breaker", "Code Breaker", 100, MissionReleaseState.PUBLISHED),
            org.assertj.core.groups.Tuple.tuple("cyber-awareness-hub", "Phishing Detective — Can You Spot the Threat?", 100, MissionReleaseState.PUBLISHED),
            org.assertj.core.groups.Tuple.tuple("pacman", "Pac-Man Challenge", 100, MissionReleaseState.PUBLISHED),
            org.assertj.core.groups.Tuple.tuple("password-chaos", "Password Chaos", 100, MissionReleaseState.PUBLISHED),
            org.assertj.core.groups.Tuple.tuple("team-trivia-battle", "Team Trivia Battle", 100, MissionReleaseState.PUBLISHED),
            org.assertj.core.groups.Tuple.tuple("word-scramble", "Cyber Word Scramble", 100, MissionReleaseState.PUBLISHED));
  }

  @Test
  void neverOverwritesExistingAdminManagedGameMissions() {
    when(missions.findBySlug("beacon-bounce")).thenReturn(Optional.of(new Mission("beacon-bounce", "Custom title", "Custom description", 250, MissionReleaseState.PUBLISHED)));
    when(missions.findBySlug("code-breaker")).thenReturn(Optional.empty());
    when(missions.findBySlug("cyber-awareness-hub")).thenReturn(Optional.empty());
    when(missions.findBySlug("pacman")).thenReturn(Optional.empty());
    when(missions.findBySlug("password-chaos")).thenReturn(Optional.empty());
    when(missions.findBySlug("team-trivia-battle")).thenReturn(Optional.empty());
    when(missions.findBySlug("word-scramble")).thenReturn(Optional.empty());

    registrar.registerMissingGames();

    verify(missions, never()).save(org.mockito.ArgumentMatchers.argThat(mission -> mission.getSlug().equals("beacon-bounce")));
    verify(missions, org.mockito.Mockito.times(6)).save(any(Mission.class));
  }

  @Test
  void automatically_registers_a_new_game_folder_with_a_safe_default_mission() {
    BuiltInGameMissionRegistrar automatic = new BuiltInGameMissionRegistrar(missions, List.of("new-rally-game"));
    when(missions.findBySlug("new-rally-game")).thenReturn(Optional.empty());

    automatic.registerMissingGames();

    ArgumentCaptor<Mission> saved = ArgumentCaptor.forClass(Mission.class);
    verify(missions).save(saved.capture());
    assertThat(saved.getValue()).extracting(Mission::getSlug, Mission::getTitle, Mission::getDescription, Mission::getMaxScore, Mission::getReleaseState)
        .containsExactly("new-rally-game", "New Rally Game", "Complete the New Rally Game challenge.", 100, MissionReleaseState.PUBLISHED);
  }
}
