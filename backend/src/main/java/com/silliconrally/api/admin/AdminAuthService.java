package com.silliconrally.api.admin;

import com.silliconrally.api.team.SessionTokenService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/** Skeleton admin authentication: move these credentials to a real identity provider before production. */
@Service
public class AdminAuthService {
  private final SessionTokenService tokens; private final String email; private final String password;
  public AdminAuthService(SessionTokenService tokens, @Value("${app.admin.email}") String email, @Value("${app.admin.password}") String password) { this.tokens = tokens; this.email = email; this.password = password; }
  public AdminDtos.AdminSessionResponse login(AdminDtos.LoginRequest request) {
    boolean validEmail = MessageDigest.isEqual(email.getBytes(StandardCharsets.UTF_8), request.email().getBytes(StandardCharsets.UTF_8));
    boolean validPassword = MessageDigest.isEqual(password.getBytes(StandardCharsets.UTF_8), request.password().getBytes(StandardCharsets.UTF_8));
    if (!validEmail || !validPassword) throw new ResponseStatusException(UNAUTHORIZED, "Invalid admin credentials");
    return new AdminDtos.AdminSessionResponse(tokens.issueAdminToken(email), email);
  }
}
