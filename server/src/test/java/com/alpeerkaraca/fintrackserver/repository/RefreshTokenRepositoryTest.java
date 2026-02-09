package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.RefreshToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class RefreshTokenRepositoryTest {
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    private UUID testUserId;
    private RefreshToken testToken;
    private Date now;
    private Date futureDate;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        now = new Date();
        futureDate = new Date(now.getTime() + 86400000);

        testToken = RefreshToken.builder()
                .tokenHash("test-token-hash-123")
                .jti("test-jti-123")
                .userId(testUserId)
                .issuedAt(now)
                .expiresAt(futureDate)
                .revoked(false)
                .build();
    }

    @Test
    void shouldSaveRefreshToken() {
        RefreshToken saved = refreshTokenRepository.save(testToken);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTokenHash()).isEqualTo("test-token-hash-123");
    }

    @Test
    void shouldFindTokenByTokenHash() {
        refreshTokenRepository.save(testToken);

        Optional<RefreshToken> found = refreshTokenRepository.findByTokenHash("test-token-hash-123");

        assertThat(found).isPresent();
        assertThat(found.get().getTokenHash()).isEqualTo("test-token-hash-123");
        assertThat(found.get().getUserId()).isEqualTo(testUserId);
    }

    @Test
    void shouldReturnEmptyWhenTokenHashNotFound() {
        Optional<RefreshToken> found = refreshTokenRepository.findByTokenHash("nonexistent-hash");

        assertThat(found).isEmpty();
    }

    @Test
    void shouldDeleteTokensByUserId() {
        RefreshToken token1 = RefreshToken.builder()
                .tokenHash("hash1")
                .userId(testUserId)
                .issuedAt(now)
                .expiresAt(futureDate)
                .build();
        RefreshToken token2 = RefreshToken.builder()
                .tokenHash("hash2")
                .userId(testUserId)
                .issuedAt(now)
                .expiresAt(futureDate)
                .build();
        refreshTokenRepository.save(token1);
        refreshTokenRepository.save(token2);

        long deletedCount = refreshTokenRepository.deleteByUserId(testUserId);

        assertThat(deletedCount).isEqualTo(2);
    }

    @Test
    void shouldReturnZeroWhenDeletingTokensForNonexistentUser() {
        long deletedCount = refreshTokenRepository.deleteByUserId(UUID.randomUUID());

        assertThat(deletedCount).isEqualTo(0);
    }

    @Test
    void shouldFindTokenById() {
        RefreshToken saved = refreshTokenRepository.save(testToken);

        Optional<RefreshToken> found = refreshTokenRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void shouldReturnEmptyWhenTokenIdNotFound() {
        Optional<RefreshToken> found = refreshTokenRepository.findById(99999L);

        assertThat(found).isEmpty();
    }

    @Test
    void shouldUpdateRefreshToken() {
        RefreshToken saved = refreshTokenRepository.save(testToken);
        saved.setRevoked(true);
        saved.setReplacedBy(12345L);

        refreshTokenRepository.save(saved);

        RefreshToken updated = refreshTokenRepository.findById(saved.getId()).get();
        assertThat(updated.isRevoked()).isTrue();
        assertThat(updated.getReplacedBy()).isEqualTo(12345L);
    }

    @Test
    void shouldDeleteRefreshToken() {
        RefreshToken saved = refreshTokenRepository.save(testToken);

        refreshTokenRepository.deleteById(saved.getId());

        Optional<RefreshToken> found = refreshTokenRepository.findById(saved.getId());
        assertThat(found).isEmpty();
    }

    @Test
    void shouldPreserveJtiWhenSaving() {
        refreshTokenRepository.save(testToken);

        RefreshToken found = refreshTokenRepository.findByTokenHash("test-token-hash-123").get();

        assertThat(found.getJti()).isEqualTo("test-jti-123");
    }

    @Test
    void shouldPreserveExpirationDates() {
        refreshTokenRepository.save(testToken);

        RefreshToken found = refreshTokenRepository.findByTokenHash("test-token-hash-123").get();

        assertThat(found.getIssuedAt()).isEqualTo(now);
        assertThat(found.getExpiresAt()).isEqualTo(futureDate);
    }

    @Test
    void shouldHandleRevokedTokenState() {
        testToken.setRevoked(true);
        refreshTokenRepository.save(testToken);

        RefreshToken found = refreshTokenRepository.findByTokenHash("test-token-hash-123").get();

        assertThat(found.isRevoked()).isTrue();
    }

    @Test
    void shouldDistinguishBetweenMultipleTokens() {
        RefreshToken token1 = RefreshToken.builder()
                .tokenHash("hash-one")
                .userId(UUID.randomUUID())
                .issuedAt(now)
                .expiresAt(futureDate)
                .build();
        RefreshToken token2 = RefreshToken.builder()
                .tokenHash("hash-two")
                .userId(UUID.randomUUID())
                .issuedAt(now)
                .expiresAt(futureDate)
                .build();

        refreshTokenRepository.save(token1);
        refreshTokenRepository.save(token2);

        Optional<RefreshToken> found1 = refreshTokenRepository.findByTokenHash("hash-one");
        Optional<RefreshToken> found2 = refreshTokenRepository.findByTokenHash("hash-two");

        assertThat(found1).isPresent();
        assertThat(found2).isPresent();
        assertThat(found1.get().getUserId()).isNotEqualTo(found2.get().getUserId());
    }

    @Test
    void shouldDeleteOnlyTokensForSpecificUser() {
        UUID userId1 = UUID.randomUUID();
        UUID userId2 = UUID.randomUUID();

        RefreshToken token1 = RefreshToken.builder()
                .tokenHash("user1-token")
                .userId(userId1)
                .issuedAt(now)
                .expiresAt(futureDate)
                .build();
        RefreshToken token2 = RefreshToken.builder()
                .tokenHash("user2-token")
                .userId(userId2)
                .issuedAt(now)
                .expiresAt(futureDate)
                .build();

        refreshTokenRepository.save(token1);
        refreshTokenRepository.save(token2);

        long deletedCount = refreshTokenRepository.deleteByUserId(userId1);

        assertThat(deletedCount).isEqualTo(1);
        assertThat(refreshTokenRepository.findByTokenHash("user1-token")).isEmpty();
        assertThat(refreshTokenRepository.findByTokenHash("user2-token")).isPresent();
    }

    @Test
    void shouldCountAllTokens() {
        refreshTokenRepository.save(testToken);
        RefreshToken anotherToken = RefreshToken.builder()
                .tokenHash("another-hash")
                .userId(UUID.randomUUID())
                .issuedAt(now)
                .expiresAt(futureDate)
                .build();
        refreshTokenRepository.save(anotherToken);

        long count = refreshTokenRepository.count();

        assertThat(count).isGreaterThanOrEqualTo(2);
    }

    @Test
    void shouldHandleTokenWithoutJti() {
        RefreshToken tokenWithoutJti = RefreshToken.builder()
                .tokenHash("hash-without-jti")
                .userId(testUserId)
                .issuedAt(now)
                .expiresAt(futureDate)
                .build();

        RefreshToken saved = refreshTokenRepository.save(tokenWithoutJti);

        RefreshToken found = refreshTokenRepository.findById(saved.getId()).get();
        assertThat(found.getJti()).isNull();
    }

    @Test
    void shouldPreserveReplacedByValue() {
        testToken.setReplacedBy(999L);
        RefreshToken saved = refreshTokenRepository.save(testToken);

        RefreshToken found = refreshTokenRepository.findById(saved.getId()).get();

        assertThat(found.getReplacedBy()).isEqualTo(999L);
    }
}
