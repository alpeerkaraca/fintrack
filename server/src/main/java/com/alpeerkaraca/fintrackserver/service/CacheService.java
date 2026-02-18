package com.alpeerkaraca.fintrackserver.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheService {
    private static final String REPORT_SUMMARY_CACHE_PREFIX = "reportSummary";
    private static final String OVERVIEW_CACHE_PREFIX = "overviews";
    private final RedisTemplate<String, Object> redisTemplate;

    public void evictUserReportSummaryCache(UUID userId) {
        String pattern = REPORT_SUMMARY_CACHE_PREFIX + "::" + userId.toString() + "_*";

        Set<String> keys = redisTemplate.keys(pattern);

        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.info("Evicted {} report summary cache entries for user {}, at {}", keys.size(), userId, System.currentTimeMillis());
        }
    }

    public void evictUserDashboardSummaryCache(UUID userId) {
        String pattern = OVERVIEW_CACHE_PREFIX + "::" + userId.toString() + ":*";

        Set<String> keys = redisTemplate.keys(pattern);

        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.info("Evicted {} dashboard overview cache entries for user {}, at {}", keys.size(), userId, System.currentTimeMillis());
        }
    }

    public void evictAllUserCaches(UUID userId) {
        evictUserReportSummaryCache(userId);
        evictUserDashboardSummaryCache(userId);
    }
}
