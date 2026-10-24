package com.silliconrally.api.games.final_flag_challenge;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

/** Atomic per-team attempts, cooldown and completion. Neither the flag nor submitted guesses are stored. */
@Service
public class FinalFlagService {
  private static final String DEFAULT_FLAG = "N7SEC{lbgh4al_r4jol_l4}";
  private final StringRedisTemplate redis;
  private final byte[] expected;
  private final int maxAttempts;
  private final long cooldown;

  public FinalFlagService(StringRedisTemplate redis,
      @Value("${FINAL_FLAG_CHALLENGE_FLAG:}") String secret,
      @Value("${FINAL_FLAG_CHALLENGE_MAX_ATTEMPTS:0}") int maxAttempts,
      @Value("${FINAL_FLAG_CHALLENGE_COOLDOWN_MS:3000}") long cooldown) {
    this.redis = redis;
    this.expected = digest(secret.isBlank() ? DEFAULT_FLAG : secret.strip());
    this.maxAttempts = Math.max(0, maxAttempts);
    this.cooldown = Math.max(1000, cooldown);
  }

  public record State(int attempts, int maxAttempts, boolean solved, boolean recorded, boolean available, long retryAfterMs) { }
  private static final DefaultRedisScript<List> READ = new DefaultRedisScript<>("""
      local t = redis.call('TIME')
      local now = tonumber(t[1])*1000 + math.floor(tonumber(t[2])/1000)
      return {tonumber(redis.call('HGET', KEYS[1], 'attempts') or '0'),
        tonumber(redis.call('HGET', KEYS[1], 'solved') or '0'),
        math.max(0, tonumber(redis.call('HGET', KEYS[1], 'nextAt') or '0') - now)}
      """, List.class);
  private static final DefaultRedisScript<List> VERIFY = new DefaultRedisScript<>("""
      local attempts = tonumber(redis.call('HGET', KEYS[1], 'attempts') or '0')
      if redis.call('HGET', KEYS[1], 'solved') == '1' then return {1, attempts, 0} end
      if tonumber(ARGV[2]) > 0 and attempts >= tonumber(ARGV[2]) then return {2, attempts, 0} end
      local t = redis.call('TIME')
      local now = tonumber(t[1])*1000 + math.floor(tonumber(t[2])/1000)
      local wait = tonumber(redis.call('HGET', KEYS[1], 'nextAt') or '0') - now
      if wait > 0 then return {3, attempts, wait} end
      attempts = attempts + 1
      redis.call('HSET', KEYS[1], 'attempts', attempts, 'solved', ARGV[1], 'nextAt', now + tonumber(ARGV[3]))
      return {0, attempts, 0}
      """, List.class);

  public State state(String key, boolean recorded) {
    List<?> values = redis.execute(READ, List.of(key));
    if (values == null) throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Challenge storage is unavailable");
    return new State(number(values, 0).intValue(), maxAttempts, recorded || number(values, 1).intValue() == 1,
        recorded, true, number(values, 2).longValue());
  }

  public State verify(String key, String flag) {
    boolean correct = MessageDigest.isEqual(expected, digest(flag.strip()));
    List<?> result = redis.execute(VERIFY, List.of(key), correct ? "1" : "0", Integer.toString(maxAttempts), Long.toString(cooldown));
    if (result == null) throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Challenge storage is unavailable");
    int code = number(result, 0).intValue();
    if (code == 1) throw new ResponseStatusException(CONFLICT, "This team has already completed the final challenge");
    if (code == 2) throw new ResponseStatusException(FORBIDDEN, "No attempts remaining");
    if (code == 3) throw new ResponseStatusException(TOO_MANY_REQUESTS, "Please wait before submitting another flag");
    return new State(number(result, 1).intValue(), maxAttempts, correct, false, true, correct ? 0 : cooldown);
  }

  private static Number number(List<?> values, int index) { return (Number) values.get(index); }
  private static byte[] digest(String text) {
    try { return MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)); }
    catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
  }
}
