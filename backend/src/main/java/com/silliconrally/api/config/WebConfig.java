package com.silliconrally.api.config;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  private final TrustedOrigins trustedOrigins;

  public WebConfig(TrustedOrigins trustedOrigins) {
    this.trustedOrigins = trustedOrigins;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    CorsConfiguration cors = apiCorsConfiguration();
    registry.addMapping("/api/**")
        .allowedOrigins(cors.getAllowedOrigins().toArray(String[]::new))
        .allowedMethods(cors.getAllowedMethods().toArray(String[]::new))
        .allowedHeaders(cors.getAllowedHeaders().toArray(String[]::new));
  }

  CorsConfiguration apiCorsConfiguration() {
    CorsConfiguration cors = new CorsConfiguration();
    cors.setAllowedOrigins(trustedOrigins.asList());
    cors.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE"));
    cors.setAllowedHeaders(List.of("Content-Type", "X-Team-Token", "X-Admin-Token"));
    return cors;
  }
}
