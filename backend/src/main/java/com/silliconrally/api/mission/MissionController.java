package com.silliconrally.api.mission;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/missions")
public class MissionController {
  private final MissionService missions;
  public MissionController(MissionService missions) { this.missions = missions; }
  @GetMapping public java.util.List<MissionDtos.MissionResponse> list() { return missions.listPublished(); }
}
