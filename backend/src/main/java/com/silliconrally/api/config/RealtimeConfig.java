package com.silliconrally.api.config;

import com.silliconrally.api.score.LeaderboardRealtimeService;
import com.silliconrally.api.score.LeaderboardWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class RealtimeConfig implements WebSocketConfigurer {
  private final LeaderboardWebSocketHandler leaderboardHandler;
  private final String allowedOrigin;

  public RealtimeConfig(LeaderboardWebSocketHandler leaderboardHandler, @Value("${app.cors.allowed-origin}") String allowedOrigin) { this.leaderboardHandler = leaderboardHandler; this.allowedOrigin = allowedOrigin; }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(leaderboardHandler, "/ws/leaderboard").setAllowedOriginPatterns(allowedOrigin);
  }

  @Bean
  RedisMessageListenerContainer leaderboardRedisListenerContainer(RedisConnectionFactory connectionFactory, LeaderboardRealtimeService listener, @Value("${app.realtime.leaderboard-channel}") String channel) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(connectionFactory);
    container.addMessageListener(listener, new ChannelTopic(channel));
    return container;
  }
}
