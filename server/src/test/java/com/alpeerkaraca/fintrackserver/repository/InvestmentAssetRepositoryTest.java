package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.InvestmentAsset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class InvestmentAssetRepositoryTest {
    @Autowired
    private InvestmentAssetRepository investmentAssetRepository;

    private InvestmentAsset testAsset;

    @BeforeEach
    void setUp() {
        testAsset = InvestmentAsset.builder()
                .symbol("AAPL")
                .name("Apple Inc.")
                .quantity(BigDecimal.valueOf(100))
                .avgCostTry(BigDecimal.valueOf(150))
                .currentPriceTry(BigDecimal.valueOf(180))
                .changePercent(BigDecimal.valueOf(20.0))
                .profitLossTry(BigDecimal.valueOf(3000))
                .build();
    }

    @Test
    void shouldSaveInvestmentAsset() {
        InvestmentAsset saved = investmentAssetRepository.save(testAsset);

        assertThat(saved.getSymbol()).isEqualTo("AAPL");
        assertThat(saved.getName()).isEqualTo("Apple Inc.");
    }

    @Test
    void shouldFindAssetBySymbol() {
        investmentAssetRepository.save(testAsset);

        Optional<InvestmentAsset> found = investmentAssetRepository.findById("AAPL");

        assertThat(found).isPresent();
        assertThat(found.get().getSymbol()).isEqualTo("AAPL");
        assertThat(found.get().getName()).isEqualTo("Apple Inc.");
    }

    @Test
    void shouldReturnEmptyWhenAssetNotFound() {
        Optional<InvestmentAsset> found = investmentAssetRepository.findById("NONEXISTENT");

        assertThat(found).isEmpty();
    }

    @Test
    void shouldDeleteInvestmentAsset() {
        investmentAssetRepository.save(testAsset);

        investmentAssetRepository.deleteById("AAPL");

        Optional<InvestmentAsset> found = investmentAssetRepository.findById("AAPL");
        assertThat(found).isEmpty();
    }

    @Test
    void shouldUpdateInvestmentAsset() {
        investmentAssetRepository.save(testAsset);
        testAsset.setCurrentPriceTry(BigDecimal.valueOf(200));
        testAsset.setChangePercent(BigDecimal.valueOf(33.33));
        testAsset.setProfitLossTry(BigDecimal.valueOf(5000));

        investmentAssetRepository.save(testAsset);

        InvestmentAsset updated = investmentAssetRepository.findById("AAPL").get();
        assertThat(updated.getCurrentPriceTry()).isEqualByComparingTo(BigDecimal.valueOf(200));
        assertThat(updated.getProfitLossTry()).isEqualByComparingTo(BigDecimal.valueOf(5000));
    }

    @Test
    void shouldPreserveAssetName() {
        investmentAssetRepository.save(testAsset);

        InvestmentAsset found = investmentAssetRepository.findById("AAPL").get();

        assertThat(found.getName()).isEqualTo("Apple Inc.");
    }

    @Test
    void shouldPreserveQuantity() {
        investmentAssetRepository.save(testAsset);

        InvestmentAsset found = investmentAssetRepository.findById("AAPL").get();

        assertThat(found.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void shouldCountAllAssets() {
        investmentAssetRepository.save(testAsset);
        InvestmentAsset anotherAsset = InvestmentAsset.builder()
                .symbol("GOOGL")
                .name("Alphabet Inc.")
                .quantity(BigDecimal.valueOf(50))
                .avgCostTry(BigDecimal.valueOf(100))
                .currentPriceTry(BigDecimal.valueOf(120))
                .changePercent(BigDecimal.valueOf(20.0))
                .profitLossTry(BigDecimal.valueOf(1000))
                .build();
        investmentAssetRepository.save(anotherAsset);

        long count = investmentAssetRepository.count();

        assertThat(count).isGreaterThanOrEqualTo(2);
    }

    @Test
    void shouldDistinguishBetweenDifferentAssets() {
        InvestmentAsset apple = InvestmentAsset.builder()
                .symbol("AAPL")
                .name("Apple Inc.")
                .quantity(BigDecimal.valueOf(100))
                .avgCostTry(BigDecimal.valueOf(150))
                .currentPriceTry(BigDecimal.valueOf(180))
                .changePercent(BigDecimal.valueOf(20.0))
                .profitLossTry(BigDecimal.valueOf(3000))
                .build();
        InvestmentAsset google = InvestmentAsset.builder()
                .symbol("GOOGL")
                .name("Alphabet Inc.")
                .quantity(BigDecimal.valueOf(50))
                .avgCostTry(BigDecimal.valueOf(100))
                .currentPriceTry(BigDecimal.valueOf(120))
                .changePercent(BigDecimal.valueOf(20.0))
                .profitLossTry(BigDecimal.valueOf(1000))
                .build();

        investmentAssetRepository.save(apple);
        investmentAssetRepository.save(google);

        InvestmentAsset foundApple = investmentAssetRepository.findById("AAPL").get();
        InvestmentAsset foundGoogle = investmentAssetRepository.findById("GOOGL").get();

        assertThat(foundApple.getQuantity()).isNotEqualByComparingTo(foundGoogle.getQuantity());
        assertThat(foundApple.getProfitLossTry()).isNotEqualByComparingTo(foundGoogle.getProfitLossTry());
    }

    @Test
    void shouldHandleZeroQuantity() {
        InvestmentAsset zeroQuantityAsset = InvestmentAsset.builder()
                .symbol("ZERO")
                .name("Zero Holdings")
                .quantity(BigDecimal.ZERO)
                .avgCostTry(BigDecimal.valueOf(100))
                .currentPriceTry(BigDecimal.valueOf(100))
                .changePercent(BigDecimal.ZERO)
                .profitLossTry(BigDecimal.ZERO)
                .build();

        investmentAssetRepository.save(zeroQuantityAsset);

        InvestmentAsset found = investmentAssetRepository.findById("ZERO").get();
        assertThat(found.getQuantity()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleNegativeProfitLoss() {
        InvestmentAsset losingAsset = InvestmentAsset.builder()
                .symbol("LOSS")
                .name("Losing Stock")
                .quantity(BigDecimal.valueOf(100))
                .avgCostTry(BigDecimal.valueOf(150))
                .currentPriceTry(BigDecimal.valueOf(120))
                .changePercent(BigDecimal.valueOf(-20.0))
                .profitLossTry(BigDecimal.valueOf(-3000))
                .build();

        investmentAssetRepository.save(losingAsset);

        InvestmentAsset found = investmentAssetRepository.findById("LOSS").get();
        assertThat(found.getProfitLossTry()).isEqualByComparingTo(BigDecimal.valueOf(-3000));
    }

    @Test
    void shouldHandleNegativeChangePercent() {
        InvestmentAsset decreasingAsset = InvestmentAsset.builder()
                .symbol("DOWN")
                .name("Declining Stock")
                .quantity(BigDecimal.valueOf(50))
                .avgCostTry(BigDecimal.valueOf(200))
                .currentPriceTry(BigDecimal.valueOf(150))
                .changePercent(BigDecimal.valueOf(-25.0))
                .profitLossTry(BigDecimal.valueOf(-2500))
                .build();

        investmentAssetRepository.save(decreasingAsset);

        InvestmentAsset found = investmentAssetRepository.findById("DOWN").get();
        assertThat(found.getChangePercent()).isEqualByComparingTo(BigDecimal.valueOf(-25.0));
    }

    @Test
    void shouldHandleLargeQuantities() {
        InvestmentAsset largeHoldingAsset = InvestmentAsset.builder()
                .symbol("LARGE")
                .name("Large Holdings")
                .quantity(BigDecimal.valueOf(999999.99))
                .avgCostTry(BigDecimal.valueOf(100))
                .currentPriceTry(BigDecimal.valueOf(120))
                .changePercent(BigDecimal.valueOf(20.0))
                .profitLossTry(BigDecimal.valueOf(19999999.80))
                .build();

        investmentAssetRepository.save(largeHoldingAsset);

        InvestmentAsset found = investmentAssetRepository.findById("LARGE").get();
        assertThat(found.getQuantity()).isEqualByComparingTo(BigDecimal.valueOf(999999.99));
    }

    @Test
    void shouldHandlePriceChanges() {
        investmentAssetRepository.save(testAsset);

        InvestmentAsset found = investmentAssetRepository.findById("AAPL").get();
        BigDecimal originalPrice = found.getCurrentPriceTry();

        found.setCurrentPriceTry(BigDecimal.valueOf(250));
        investmentAssetRepository.save(found);

        InvestmentAsset updated = investmentAssetRepository.findById("AAPL").get();
        assertThat(updated.getCurrentPriceTry()).isNotEqualByComparingTo(originalPrice);
        assertThat(updated.getCurrentPriceTry()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void shouldPreserveSymbolKeyAfterUpdate() {
        investmentAssetRepository.save(testAsset);
        String originalSymbol = testAsset.getSymbol();

        testAsset.setCurrentPriceTry(BigDecimal.valueOf(250));
        investmentAssetRepository.save(testAsset);

        InvestmentAsset updated = investmentAssetRepository.findById(originalSymbol).get();
        assertThat(updated.getSymbol()).isEqualTo(originalSymbol);
    }

    @Test
    void shouldHandleDecimalPriceValues() {
        InvestmentAsset decimalAsset = InvestmentAsset.builder()
                .symbol("DECIMAL")
                .name("Decimal Price Stock")
                .quantity(BigDecimal.valueOf(100.50))
                .avgCostTry(BigDecimal.valueOf(123.45))
                .currentPriceTry(BigDecimal.valueOf(154.32))
                .changePercent(BigDecimal.valueOf(25.10))
                .profitLossTry(BigDecimal.valueOf(3086.95))
                .build();

        investmentAssetRepository.save(decimalAsset);

        InvestmentAsset found = investmentAssetRepository.findById("DECIMAL").get();
        assertThat(found.getAvgCostTry()).isEqualByComparingTo(BigDecimal.valueOf(123.45));
        assertThat(found.getCurrentPriceTry()).isEqualByComparingTo(BigDecimal.valueOf(154.32));
    }
}
