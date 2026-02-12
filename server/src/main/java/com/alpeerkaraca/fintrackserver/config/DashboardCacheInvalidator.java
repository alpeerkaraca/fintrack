package com.alpeerkaraca.fintrackserver.config;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DashboardCacheInvalidator {
    private final CacheManager cacheManager;

    public void evictOverview(UUID userId, Set<YearMonth> months) {
        Cache cache = cacheManager.getCache("overviews");
        if (cache == null) return;

        for (YearMonth ym : months) {
            String key = String.format("%s:%04d-%02d", userId, ym.getYear(), ym.getMonthValue());
            cache.evict(key);
        }
    }
}
