package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.AssetType;
import com.alpeerkaraca.fintrackserver.model.InvestmentAsset;
import com.alpeerkaraca.fintrackserver.model.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class InvestmentAssetRepositoryTest {

    @Autowired
    private InvestmentAssetRepository investmentAssetRepository;

    @Autowired
    private TestEntityManager entityManager;

    private UserProfile testUser;
    private InvestmentAsset testAsset;

    @BeforeEach
    void setUp() {
        // UserProfile foreign key kısıtlaması olduğu için önce bir user oluşturmalıyız
        testUser = UserProfile.builder()
                .email("test@fintrack.com")
                .username("testuser")
                .password("password")
                .creditCardLimitTry(BigDecimal.valueOf(10000))
                .netSalaryUsd(BigDecimal.valueOf(3000))
                .createdAt(Instant.now())
                .build();
        entityManager.persist(testUser);

        testAsset = InvestmentAsset.builder()
                .symbol("AAPL")
                .name("Apple Inc.")
                .quantity(BigDecimal.valueOf(100))
                .type(AssetType.STOCK)
                .userProfile(testUser)
                .build();
    }

    @Test
    void shouldSaveInvestmentAsset() {
        InvestmentAsset saved = investmentAssetRepository.save(testAsset);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getSymbol()).isEqualTo("AAPL");
    }

    @Test
    void shouldFindAssetById() {
        InvestmentAsset saved = investmentAssetRepository.save(testAsset);

        Optional<InvestmentAsset> found = investmentAssetRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getSymbol()).isEqualTo("AAPL");
    }

    @Test
    void shouldUpdateInvestmentMetadata() {
        InvestmentAsset saved = investmentAssetRepository.save(testAsset);
        saved.setQuantity(BigDecimal.valueOf(200));
        saved.setAvgCostOriginal(BigDecimal.valueOf(175));

        investmentAssetRepository.save(saved);

        InvestmentAsset updated = investmentAssetRepository.findById(saved.getId()).get();
        assertThat(updated.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(200));
        assertThat(updated.getAvgCostOriginal()).isEqualByComparingTo(BigDecimal.valueOf(175));
    }

    @Test
    void shouldDeleteInvestmentAsset() {
        InvestmentAsset saved = investmentAssetRepository.save(testAsset);
        UUID savedId = saved.getId();

        investmentAssetRepository.deleteById(savedId);

        Optional<InvestmentAsset> found = investmentAssetRepository.findById(savedId);
        assertThat(found).isEmpty();
    }

    @Test
    void shouldFindAllByUserProfileId() {
        investmentAssetRepository.save(testAsset);

        var assets = investmentAssetRepository.findByUserProfileId(testUser.getId());

        assertThat(assets).hasSize(1);
        assertThat(assets.get(0).getSymbol()).isEqualTo("AAPL");
    }

    @Test
    void shouldHandleLargeQuantities() {
        InvestmentAsset largeHolding = InvestmentAsset.builder()
                .symbol("GOLD")
                .name("Gram Altın")
                .quantity(BigDecimal.valueOf(999999.99))
                .totalCostTry(BigDecimal.valueOf(2500))
                .type(AssetType.GOLD_SILVER)
                .userProfile(testUser)
                .build();

        InvestmentAsset saved = investmentAssetRepository.save(largeHolding);

        assertThat(saved.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(999999.99));
    }
}