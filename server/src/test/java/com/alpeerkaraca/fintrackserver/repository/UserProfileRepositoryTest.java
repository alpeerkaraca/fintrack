package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserProfileRepositoryTest {
    @Autowired
    private UserProfileRepository userProfileRepository;

    private UserProfile testUser;

    @BeforeEach
    void setUp() {
        testUser = UserProfile.builder()
                .username("testuser")
                .email("test@user.com")
                .password("password")
                .netSalaryUsd(BigDecimal.valueOf(123)).build();
    }

    @Test
    void shouldSaveUserProfile() {
        userProfileRepository.save(testUser);

        UserProfile found = userProfileRepository.findByUsername("testuser").get();

        assertThat(found).isNotNull();
        assertThat(found.getEmail()).isEqualTo("test@user.com");
    }

    @Test
    void shouldFindUserByUsername() {
        userProfileRepository.save(testUser);

        Optional<UserProfile> found = userProfileRepository.findByUsername("testuser");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@user.com");
        assertThat(found.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    void shouldReturnEmptyWhenUserNotFoundByUsername() {
        Optional<UserProfile> found = userProfileRepository.findByUsername("nonexistent");

        assertThat(found).isEmpty();
    }

    @Test
    void shouldReturnFalseWhenEmailDoesNotExist() {
        boolean exists = userProfileRepository.existsByEmail("notfound@user.com");

        assertThat(exists).isFalse();
    }

    @Test
    void shouldReturnTrueWhenEmailExists() {
        userProfileRepository.save(testUser);

        boolean exists = userProfileRepository.existsByEmail("test@user.com");

        assertThat(exists).isTrue();
    }

    @Test
    void shouldReturnFalseWhenUsernameDoesNotExist() {
        boolean exists = userProfileRepository.existsByUsername("nonexistent");

        assertThat(exists).isFalse();
    }

    @Test
    void shouldReturnTrueWhenUsernameExists() {
        userProfileRepository.save(testUser);

        boolean exists = userProfileRepository.existsByUsername("testuser");

        assertThat(exists).isTrue();
    }

    @Test
    void shouldFindUserById() {
        UserProfile saved = userProfileRepository.save(testUser);

        Optional<UserProfile> found = userProfileRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void shouldReturnEmptyWhenUserIdNotFound() {
        Optional<UserProfile> found = userProfileRepository.findById(UUID.randomUUID());

        assertThat(found).isEmpty();
    }

    @Test
    void shouldDeleteUserProfile() {
        UserProfile saved = userProfileRepository.save(testUser);

        userProfileRepository.deleteById(saved.getId());

        Optional<UserProfile> found = userProfileRepository.findById(saved.getId());
        assertThat(found).isEmpty();
    }

    @Test
    void shouldUpdateUserProfile() {
        UserProfile saved = userProfileRepository.save(testUser);
        saved.setEmail("newemail@user.com");
        saved.setNetSalaryUsd(BigDecimal.valueOf(500));

        userProfileRepository.save(saved);

        UserProfile updated = userProfileRepository.findById(saved.getId()).get();
        assertThat(updated.getEmail()).isEqualTo("newemail@user.com");
        assertThat(updated.getNetSalaryUsd()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void shouldCountAllUsers() {
        userProfileRepository.save(testUser);
        UserProfile anotherUser = UserProfile.builder()
                .username("anotheruser")
                .email("another@user.com")
                .password("password")
                .netSalaryUsd(BigDecimal.valueOf(456)).build();
        userProfileRepository.save(anotherUser);

        long count = userProfileRepository.count();

        assertThat(count).isGreaterThanOrEqualTo(2);
    }

    @Test
    void shouldPreserveUserCreatedAtTimestamp() {
        UserProfile saved = userProfileRepository.save(testUser);

        UserProfile found = userProfileRepository.findById(saved.getId()).get();

        assertThat(found.getCreatedAt()).isNotNull();
    }

    @Test
    void shouldDistinguishBetweenMultipleUsers() {
        UserProfile user1 = UserProfile.builder()
                .username("user1")
                .email("user1@example.com")
                .password("password1")
                .netSalaryUsd(BigDecimal.valueOf(1000)).build();
        UserProfile user2 = UserProfile.builder()
                .username("user2")
                .email("user2@example.com")
                .password("password2")
                .netSalaryUsd(BigDecimal.valueOf(2000)).build();

        userProfileRepository.save(user1);
        userProfileRepository.save(user2);

        Optional<UserProfile> found1 = userProfileRepository.findByUsername("user1");
        Optional<UserProfile> found2 = userProfileRepository.findByUsername("user2");

        assertThat(found1).isPresent();
        assertThat(found2).isPresent();
        assertThat(found1.get().getEmail()).isNotEqualTo(found2.get().getEmail());
        assertThat(found1.get().getNetSalaryUsd()).isNotEqualByComparingTo(found2.get().getNetSalaryUsd());
    }
}
