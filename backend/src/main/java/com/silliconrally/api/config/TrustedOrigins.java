package com.silliconrally.api.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Exact browser origins trusted by the REST and WebSocket entry points. */
@Component
public class TrustedOrigins {
  private final List<String> values;

  public TrustedOrigins(@Value("${app.cors.allowed-origins}") String[] values) {
    this.values = Arrays.stream(values)
        .map(String::trim)
        .filter(value -> !value.isEmpty())
        .distinct()
        .toList();
    if (this.values.isEmpty()) throw new IllegalStateException("At least one trusted browser origin is required");
    if (this.values.stream().anyMatch(value -> value.contains("*"))) {
      throw new IllegalStateException("Trusted browser origins must be exact origins, not wildcard patterns");
    }
  }

  public String[] asArray() {
    return values.toArray(String[]::new);
  }

  public List<String> asList() {
    return values;
  }
}
