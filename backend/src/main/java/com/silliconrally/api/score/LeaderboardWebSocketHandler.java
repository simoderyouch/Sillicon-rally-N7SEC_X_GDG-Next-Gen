package com.silliconrally.api.score;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class LeaderboardWebSocketHandler extends TextWebSocketHandler {
  private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

  @Override public void afterConnectionEstablished(WebSocketSession session) { sessions.add(session); }
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
