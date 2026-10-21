package com.silliconrally.api.mission;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MissionRepository extends JpaRepository<Mission, UUID> {
  List<Mission> findByReleaseState(MissionReleaseState releaseState);
  Optional<Mission> findBySlug(String slug);
}
