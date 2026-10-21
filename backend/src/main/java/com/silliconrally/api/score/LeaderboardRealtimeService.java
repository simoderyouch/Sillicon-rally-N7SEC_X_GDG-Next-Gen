package com.silliconrally.api.score;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class LeaderboardRealtimeService implements MessageListener {
  private final StringRedisTemplate redis;
  private final ObjectMapper json;
  private final LeaderboardWebSocketHandler sockets;
  private final String channel;

  public LeaderboardRealtimeService(StringRedisTemplate redis, ObjectMapper json, LeaderboardWebSocketHandler sockets, @Value("${app.realtime.leaderboard-channel}") String channel) { this.redis = redis; this.json = json; this.sockets = sockets; this.channel = channel; }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void publish(LeaderboardUpdatedEvent event) {
    try { redis.convertAndSend(channel, json.writeValueAsString(event.entries())); }
    catch (JsonProcessingException exception) { throw new IllegalStateException("Could not serialise leaderboard update", exception); }
  }

  @Override
  public void onMessage(Message message, byte[] pattern) {
    sockets.broadcast(new String(message.getBody(), StandardCharsets.UTF_8));
  }
}
