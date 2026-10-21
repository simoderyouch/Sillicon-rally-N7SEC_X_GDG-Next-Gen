package com.silliconrally.api.event;

public final class EventDtos {
  private EventDtos() { }
  public record EventStateResponse(boolean isOpen, boolean leaderboardLocked) { }
  public record UpdateEventStateRequest(Boolean isOpen, Boolean leaderboardLocked) { }
  public static EventStateResponse from(EventState state) { return new EventStateResponse(state.isOpen(), state.isLeaderboardLocked()); }
}
