package com.silliconrally.api.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.silliconrally.api.score.LeaderboardWebSocketHandler;
import java.util.HashMap;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistration;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.handler.OriginHandshakeInterceptor;

class OriginPolicyTest {
  private static final String PRODUCTION_ORIGIN = "https://silicon-rally.edder.studio";
  private final TrustedOrigins origins = new TrustedOrigins(new String[] {
      "http://localhost:5173", "http://127.0.0.1:5173", PRODUCTION_ORIGIN
  });

  @Test
  void acceptsTheExplicitProductionOriginForTheWebSocketHandshake() throws Exception {
    OriginHandshakeInterceptor interceptor = new OriginHandshakeInterceptor(origins.asList());

    assertThat(handshakeAllowed(interceptor, PRODUCTION_ORIGIN)).isTrue();
  }

  @Test
  void rejectsAnUntrustedWebSocketOrigin() throws Exception {
    OriginHandshakeInterceptor interceptor = new OriginHandshakeInterceptor(origins.asList());

    assertThat(handshakeAllowed(interceptor, "https://attacker.example")).isFalse();
  }

  @Test
  void allowsTheProductionOriginAndRejectsUnknownOriginsForTeamSessionCors() {
    var cors = new WebConfig(origins).apiCorsConfiguration();

    assertThat(cors.checkOrigin(PRODUCTION_ORIGIN)).isEqualTo(PRODUCTION_ORIGIN);
    assertThat(cors.checkOrigin("https://attacker.example")).isNull();
  }

  @Test
  void registersTheExactTrustedOriginsWithTheActualWebSocketHandler() {
    LeaderboardWebSocketHandler handler = mock(LeaderboardWebSocketHandler.class);
    WebSocketHandlerRegistry registry = mock(WebSocketHandlerRegistry.class);
    WebSocketHandlerRegistration registration = mock(WebSocketHandlerRegistration.class);
    when(registry.addHandler(handler, "/ws/leaderboard")).thenReturn(registration);

    new RealtimeConfig(handler, origins).registerWebSocketHandlers(registry);

    verify(registration).setAllowedOrigins("http://localhost:5173", "http://127.0.0.1:5173", PRODUCTION_ORIGIN);
  }

  @Test
  void rejectsWildcardOriginConfiguration() {
    assertThatThrownBy(() -> new TrustedOrigins(new String[] { "https://*.example.com" }))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("not wildcard patterns");
  }

  private boolean handshakeAllowed(OriginHandshakeInterceptor interceptor, String origin) throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/ws/leaderboard");
    request.addHeader(HttpHeaders.ORIGIN, origin);
    return interceptor.beforeHandshake(
        new ServletServerHttpRequest(request),
        new ServletServerHttpResponse(new MockHttpServletResponse()),
        new LeaderboardWebSocketHandler(),
        new HashMap<>());
  }
}
