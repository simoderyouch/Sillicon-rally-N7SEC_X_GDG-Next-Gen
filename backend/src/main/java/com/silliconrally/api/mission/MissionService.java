package com.silliconrally.api.mission;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional
public class MissionService {
  private final MissionRepository missions;
  public MissionService(MissionRepository missions) { this.missions = missions; }
  @Transactional(readOnly = true) public List<MissionDtos.MissionResponse> listPublished() { return missions.findByReleaseState(MissionReleaseState.PUBLISHED).stream().map(MissionDtos::from).toList(); }
  @Transactional(readOnly = true) public List<MissionDtos.MissionResponse> listAll() { return missions.findAll().stream().map(MissionDtos::from).toList(); }
  public MissionDtos.MissionResponse create(MissionDtos.UpsertRequest request) { String slug = request.slug().trim(); if (missions.findBySlug(slug).isPresent()) throw new ResponseStatusException(CONFLICT, "Mission slug is already in use"); return MissionDtos.from(missions.save(new Mission(slug, request.title().trim(), request.description().trim(), request.maxScore(), request.releaseState()))); }
  public MissionDtos.MissionResponse update(UUID id, MissionDtos.UpsertRequest request) { Mission mission = missions.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Mission not found")); String slug = request.slug().trim(); missions.findBySlug(slug).filter(other -> !other.getId().equals(id)).ifPresent(other -> { throw new ResponseStatusException(CONFLICT, "Mission slug is already in use"); }); mission.update(slug, request.title().trim(), request.description().trim(), request.maxScore(), request.releaseState()); return MissionDtos.from(mission); }
}
