package com.silliconrally.api.mission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class MissionServiceTest {
  private final MissionRepository missions = org.mockito.Mockito.mock(MissionRepository.class);
  private final MissionService service = new MissionService(missions);

  @Test
  void createsAnAdminMission() {
    MissionDtos.UpsertRequest request = new MissionDtos.UpsertRequest("beacon-bounce", "Beacon Bounce", "Follow the signal.", 200, MissionReleaseState.DRAFT);
    when(missions.findBySlug("beacon-bounce")).thenReturn(Optional.empty());
    when(missions.save(any(Mission.class))).thenAnswer(invocation -> invocation.getArgument(0));

    MissionDtos.MissionResponse response = service.create(request);

    assertThat(response.slug()).isEqualTo("beacon-bounce");
    assertThat(response.title()).isEqualTo("Beacon Bounce");
    assertThat(response.maxScore()).isEqualTo(200);
    assertThat(response.releaseState()).isEqualTo(MissionReleaseState.DRAFT);
  }

  @Test
  void rejectsAnAlreadyUsedMissionSlug() {
    Mission existing = new Mission("beacon-bounce", "Existing", "Existing challenge.", 100, MissionReleaseState.PUBLISHED);
    when(missions.findBySlug("beacon-bounce")).thenReturn(Optional.of(existing));

    assertThatThrownBy(() -> service.create(new MissionDtos.UpsertRequest("beacon-bounce", "New", "New challenge.", 100, MissionReleaseState.DRAFT)))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("already in use");
  }
}
