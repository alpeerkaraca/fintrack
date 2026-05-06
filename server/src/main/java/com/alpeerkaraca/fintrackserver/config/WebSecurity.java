package com.alpeerkaraca.fintrackserver.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import com.alpeerkaraca.fintrackserver.security.JwtSecurityFilter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import com.alpeerkaraca.fintrackserver.security.CsrfCookieFilter;
import java.util.Arrays;

@Configuration
@EnableWebSecurity(debug = false)
public class WebSecurity {
    private final JwtSecurityFilter jwtSecurityFilter;
    private final CsrfCookieFilter csrfCookieFilter;

    @Value("${app.cors.allowed-origins:http://localhost:3000,https://localhost:3000}")
    private String allowedOrigins;

    public WebSecurity(JwtSecurityFilter jwtSecurityFilter, CsrfCookieFilter csrfCookieFilter) {
        this.jwtSecurityFilter = jwtSecurityFilter;
        this.csrfCookieFilter = csrfCookieFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain configure(HttpSecurity http) {
        http
                // Allowed on dev
                .cors(corsConfig -> corsConfig.configurationSource(
                        (CorsConfigurationSource) request -> {
                            CorsConfiguration corsConfiguration = new CorsConfiguration();
                            corsConfiguration.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
                            corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                            corsConfiguration.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN", "Authorization"));
                            corsConfiguration.setAllowCredentials(true);
                            return corsConfiguration;
                        }))
                .csrf(csrf -> {
                    CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
                    repo.setCookieCustomizer(customizer -> customizer.sameSite("None").secure(true));
                    csrf.csrfTokenRepository(repo)
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler());
                })
                .authorizeHttpRequests(req -> req
                        .requestMatchers("/api/v1/auth/*").permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterAfter(csrfCookieFilter, BasicAuthenticationFilter.class)
                .addFilterBefore(jwtSecurityFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
