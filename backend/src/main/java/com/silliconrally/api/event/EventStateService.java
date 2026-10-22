package com.silliconrally.api.event;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
@Transactional
public class EventStateService {
  private final EventStateRepository states;
  public EventStateService(EventStateRepository states) { this.states = states; }
  public EventDtos.EventStateResponse get() { return EventDtos.from(state()); }
  public EventDtos.EventStateResponse update(EventDtos.UpdateEventStateRequest request) { EventState state = state(); state.update(request.isOpen(), request.leaderboardLocked()); return EventDtos.from(state); }
  public void reset() { state().update(false, false); }
  private EventState state() { return states.findById(1L).orElseThrow(() -> new ResponseStatusException(INTERNAL_SERVER_ERROR, "Event state has not been initialized")); }
}
