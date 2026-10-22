package com.silliconrally.api.admin;

import com.silliconrally.api.mission.MissionDtos;
import com.silliconrally.api.mission.MissionService;
import com.silliconrally.api.team.SessionTokenService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/missions")
public class AdminMissionController {
  private final SessionTokenService tokens; private final MissionService missions;
  public AdminMissionController(SessionTokenService tokens, MissionService missions) { this.tokens = tokens; this.missions = missions; }
  @GetMapping public List<MissionDtos.MissionResponse> list(@RequestHeader(value = "X-Admin-Token", required = false) String token) { tokens.requireAdmin(token); return missions.listAll(); }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public MissionDtos.MissionResponse create(@RequestHeader(value = "X-Admin-Token", required = false) String token, @Valid @RequestBody MissionDtos.UpsertRequest request) { tokens.requireAdmin(token); return missions.create(request); }
  @PutMapping("/{id}") public MissionDtos.MissionResponse update(@RequestHeader(value = "X-Admin-Token", required = false) String token, @PathVariable UUID id, @Valid @RequestBody MissionDtos.UpsertRequest request) { tokens.requireAdmin(token); return missions.update(id, request); }
}
