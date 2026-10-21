package com.silliconrally.api.score;

import java.util.List;

public record LeaderboardUpdatedEvent(List<ScoreDtos.LeaderboardEntry> entries) { }
