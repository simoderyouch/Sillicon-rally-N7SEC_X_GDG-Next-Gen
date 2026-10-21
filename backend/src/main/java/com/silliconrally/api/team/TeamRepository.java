package com.silliconrally.api.team;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, UUID> {
  Optional<Team> findByDisplayNameIgnoreCase(String displayName);
}
