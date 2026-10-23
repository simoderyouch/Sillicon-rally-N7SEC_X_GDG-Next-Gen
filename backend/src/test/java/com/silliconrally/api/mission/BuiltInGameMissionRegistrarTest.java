package com.silliconrally.api.mission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class BuiltInGameMissionRegistrarTest {
  private final MissionRepository missions = org.mockito.Mockito.mock(MissionRepository.class);
  private final BuiltInGameMissionRegistrar registrar = new BuiltInGameMissionRegistrar(missions);

  @Test
  void addsEveryMissingBuiltInGameAsADraft() {
    when(missions.findBySlug(any())).thenReturn(Optional.empty());
    ArgumentCaptor<Mission> saved = ArgumentCaptor.forClass(Mission.class);

    registrar.registerMissingGames();

    verify(missions, org.mockito.Mockito.times(3)).save(saved.capture());
    assertThat(saved.getAllValues())
        .extracting(Mission::getSlug, Mission::getTitle, Mission::getMaxScore, Mission::getReleaseState)
        .containsExactlyInAnyOrder(
            org.assertj.core.groups.Tuple.tuple("beacon-bounce", "Beacon Bounce", 100, MissionReleaseState.DRAFT),
            org.assertj.core.groups.Tuple.tuple("code-breaker", "Code Breaker", 100, MissionReleaseState.DRAFT),
            org.assertj.core.groups.Tuple.tuple("parcel-panic", "Parcel Panic", 100, MissionReleaseState.DRAFT));
  }

  @Test
  void neverOverwritesExistingAdminManagedGameMissions() {
    when(missions.findBySlug("beacon-bounce")).thenReturn(Optional.of(new Mission("beacon-bounce", "Custom title", "Custom description", 250, MissionReleaseState.PUBLISHED)));
    when(missions.findBySlug("code-breaker")).thenReturn(Optional.empty());
    when(missions.findBySlug("parcel-panic")).thenReturn(Optional.empty());

    registrar.registerMissingGames();

    verify(missions, never()).save(org.mockito.ArgumentMatchers.argThat(mission -> mission.getSlug().equals("beacon-bounce")));
    verify(missions, org.mockito.Mockito.times(2)).save(any(Mission.class));
  }
}
