package com.alpeerkaraca.fintrackserver.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimitingService {
    private final StringRedisTemplate redisTemplate;
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration DURATION = Duration.ofMinutes(1);

    public boolean isAllowed(String action, String identifier) {
        String key = "rate:" + action + ":" + identifier;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, DURATION);
        }
        return count == null || count <= MAX_ATTEMPTS;
    }
    
    public void reset(String action, String identifier) {
        String key = "rate:" + action + ":" + identifier;
        redisTemplate.delete(key);
    }
}
