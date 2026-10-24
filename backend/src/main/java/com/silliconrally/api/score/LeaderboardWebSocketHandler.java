package com.silliconrally.api.score;

import com.silliconrally.api.team.SessionTokenService;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class LeaderboardWebSocketHandler extends TextWebSocketHandler {
  private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
  private final SessionTokenService tokens;

  @Autowired
  public LeaderboardWebSocketHandler(SessionTokenService tokens) { this.tokens = tokens; }

  /** Kept package-compatible with origin-policy tests that do not authenticate a socket. */
  public LeaderboardWebSocketHandler() { this.tokens = null; }

  @Override protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    try {
      if (tokens == null) throw new IllegalStateException("Admin session validation is unavailable");
      tokens.requireAdmin(message.getPayload());
      sessions.add(session);
    } catch (RuntimeException exception) {
      sessions.remove(session);
      session.close(CloseStatus.POLICY_VIOLATION);
    }
  }
  @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { sessions.remove(session); }
  @Override public void handleTransportError(WebSocketSession session, Throwable exception) { sessions.remove(session); }

  public void broadcast(String payload) {
    TextMessage message = new TextMessage(payload);
    for (WebSocketSession session : sessions) {
      try {
        if (session.isOpen()) synchronized (session) { session.sendMessage(message); }
      } catch (IOException exception) { sessions.remove(session); }
    }
  }
}
