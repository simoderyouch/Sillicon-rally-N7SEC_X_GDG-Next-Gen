package com.silliconrally.api.mission;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/missions")
public class MissionController {
  private final MissionRepository missions;
  public MissionController(MissionRepository missions) { this.missions = missions; }
  @GetMapping public List<Mission> list() { return missions.findByReleaseState(MissionReleaseState.PUBLISHED); }
}
