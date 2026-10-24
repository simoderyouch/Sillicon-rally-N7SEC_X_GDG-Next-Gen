package com.silliconrally.api.score;

import com.silliconrally.api.mission.Mission;
import com.silliconrally.api.team.Team;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameScoreRepository extends JpaRepository<GameScore, UUID> {
  Optional<GameScore> findByTeamAndMission(Team team, Mission mission);
  List<GameScore> findAllByTeamOrderBySubmittedAtDesc(Team team);
}
