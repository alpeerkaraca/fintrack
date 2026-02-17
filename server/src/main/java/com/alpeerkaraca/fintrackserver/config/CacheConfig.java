package com.alpeerkaraca.fintrackserver.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import tools.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import tools.jackson.databind.jsontype.PolymorphicTypeValidator;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import tools.jackson.databind.DefaultTyping;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.cfg.JsonNodeFeature;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType("com.alpeerkaraca.fintrackserver.")
                .allowIfBaseType("java.util.")
                .allowIfBaseType("java.math.")
                .allowIfBaseType("java.time.")
                .allowIfSubType("com.alpeerkaraca.fintrackserver.")
                .allowIfSubType("java.time.")
                .allowIfSubType("java.math.")
                .allowIfSubType("java.util.")
                .build();


        ObjectMapper mapper = JsonMapper.builder()
                .enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
                .enable(DeserializationFeature.USE_BIG_INTEGER_FOR_INTS)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true)
                .configure(JsonNodeFeature.STRIP_TRAILING_BIGDECIMAL_ZEROES, false)
                .activateDefaultTyping(
                        ptv,
                        DefaultTyping.NON_FINAL,
                        JsonTypeInfo.As.PROPERTY
                ).build();
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJacksonJsonRedisSerializer(mapper)
                        ));

        RedisCacheConfiguration exchangeCfg = defaults.entryTtl(Duration.ofDays(1));
        RedisCacheConfiguration fundCfg = defaults.entryTtl(Duration.ofDays(1));
        RedisCacheConfiguration stockCfg = defaults.entryTtl(Duration.ofMinutes(5));
        RedisCacheConfiguration metalCfg = defaults.entryTtl(Duration.ofMinutes(5));
        RedisCacheConfiguration overviewCfg = defaults.entryTtl(Duration.ofMinutes(2));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaults)
                .withCacheConfiguration("exchangeRates", exchangeCfg)
                .withCacheConfiguration("fundPrices", fundCfg)
                .withCacheConfiguration("metalPrices", metalCfg)
                .withCacheConfiguration("stockPrices", stockCfg)
                .withCacheConfiguration("overviews", overviewCfg)
                .build();
    }
}
