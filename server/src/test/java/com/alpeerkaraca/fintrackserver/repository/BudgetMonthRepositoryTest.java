package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.BudgetMonth;
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
class BudgetMonthRepositoryTest {
    @Autowired
    private BudgetMonthRepository budgetMonthRepository;

    private BudgetMonth testBudgetMonth;
    private UserProfile testUserProfile;
    private UUID testMonthId = UUID.randomUUID();
    private UUID testUserId = UUID.randomUUID();
    @BeforeEach
    void setUp() {
        testUserProfile = UserProfile.builder()
                .id(testUserId)
                .username("testuser")
                .email("test@fintrack.com")
                .password("usertestpasswordsisherebutshouldbereplacedwithhash")
                .netSalaryUsd(BigDecimal.valueOf(1000))
                .creditCardLimitTry(BigDecimal.valueOf(1000))
                .build();
        testBudgetMonth = BudgetMonth.builder()
                .id(testMonthId)
                .month(1)
                .year(2024)
                .label("January 2024")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .userProfile(testUserProfile)
                .build();

    }

    @Test
    void shouldSaveBudgetMonth() {
        BudgetMonth saved = budgetMonthRepository.save(testBudgetMonth);

        assertThat(saved.getMonth()).isEqualTo(1);
        assertThat(saved.getYear()).isEqualTo(2024);
        assertThat(saved.getLabel()).isEqualTo("January 2024");
    }

    @Test
    void shouldFindBudgetMonthById() {
        budgetMonthRepository.save(testBudgetMonth);

        Optional<BudgetMonth> found = budgetMonthRepository.findById(testMonthId);

        assertThat(found).isPresent();
        assertThat(found.get().getMonth()).isEqualTo(1);
        assertThat(found.get().getYear()).isEqualTo(2024);
    }

    @Test
    void shouldReturnEmptyWhenBudgetMonthNotFound() {
        Optional<BudgetMonth> found = budgetMonthRepository.findById(UUID.randomUUID());

        assertThat(found).isEmpty();
    }

    @Test
    void shouldDeleteBudgetMonth() {
        budgetMonthRepository.save(testBudgetMonth);

        budgetMonthRepository.deleteById(testMonthId);

        Optional<BudgetMonth> found = budgetMonthRepository.findById(testMonthId);
        assertThat(found).isEmpty();
    }

    @Test
    void shouldUpdateBudgetMonth() {
        budgetMonthRepository.save(testBudgetMonth);
        testBudgetMonth.setIncomeTry(BigDecimal.valueOf(15000));
        testBudgetMonth.setExpenseTry(BigDecimal.valueOf(8000));
        testBudgetMonth.setNetSavingsTry(BigDecimal.valueOf(7000));

        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth updated = budgetMonthRepository.findById(testMonthId).get();
        assertThat(updated.getIncomeTry()).isEqualByComparingTo(BigDecimal.valueOf(15000));
        assertThat(updated.getExpenseTry()).isEqualByComparingTo(BigDecimal.valueOf(8000));
        assertThat(updated.getNetSavingsTry()).isEqualByComparingTo(BigDecimal.valueOf(7000));
    }

    @Test
    void shouldPreserveMonthIdentifier() {
        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById(testMonthId).get();

        assertThat(found.getMonth()).isEqualTo(1);
        assertThat(found.getYear()).isEqualTo(2024);
    }

    @Test
    void shouldPreserveLabel() {
        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById(testMonthId).get();

        assertThat(found.getLabel()).isEqualTo("January 2024");
    }

    @Test
    void shouldCountAllBudgetMonths() {
        budgetMonthRepository.save(testBudgetMonth);
        BudgetMonth anotherMonth = BudgetMonth.builder()
                .month(2)
                .year(2024)
                .label("February 2024")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(6500))
                .netSavingsTry(BigDecimal.valueOf(3500))
                .build();
        budgetMonthRepository.save(anotherMonth);

        long count = budgetMonthRepository.count();

        assertThat(count).isGreaterThanOrEqualTo(2);
    }

    @Test
    void shouldDistinguishBetweenDifferentMonths() {
        UUID janId = UUID.randomUUID();
        UUID febId = UUID.randomUUID();
        BudgetMonth january = BudgetMonth.builder()
                .id(janId)
                .month(1)
                .year(2024)
                .label("January 2024")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();
        BudgetMonth february = BudgetMonth.builder()
                .id(febId)
                .month(2)
                .year(2024)
                .label("February 2024")
                .incomeTry(BigDecimal.valueOf(11000))
                .expenseTry(BigDecimal.valueOf(8000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();

        budgetMonthRepository.save(january);
        budgetMonthRepository.save(february);

        BudgetMonth foundJanuary = budgetMonthRepository.findById(janId).get();
        BudgetMonth foundFebruary = budgetMonthRepository.findById(febId).get();

        assertThat(foundJanuary.getIncomeTry()).isNotEqualByComparingTo(foundFebruary.getIncomeTry());
        assertThat(foundJanuary.getExpenseTry()).isNotEqualByComparingTo(foundFebruary.getExpenseTry());
    }

    @Test
    void shouldHandleZeroIncome() {
        UUID noIncomeId = UUID.randomUUID();
        BudgetMonth noIncomeMonth = BudgetMonth.builder()
                .id(noIncomeId)
                .month(3)
                .year(2024)
                .label("March 2024")
                .incomeTry(BigDecimal.ZERO)
                .expenseTry(BigDecimal.valueOf(1000))
                .netSavingsTry(BigDecimal.valueOf(-1000))
                .build();

        budgetMonthRepository.save(noIncomeMonth);

        BudgetMonth found = budgetMonthRepository.findById(noIncomeId).get();
        assertThat(found.getIncomeTry()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleZeroExpense() {
        UUID noExpenseId = UUID.randomUUID();
        BudgetMonth noExpenseMonth = BudgetMonth.builder()
                .id(noExpenseId)
                .month(4)
                .year(2024)
                .label("April 2024")
                .incomeTry(BigDecimal.valueOf(5000))
                .expenseTry(BigDecimal.ZERO)
                .netSavingsTry(BigDecimal.valueOf(5000))
                .build();

        budgetMonthRepository.save(noExpenseMonth);

        BudgetMonth found = budgetMonthRepository.findById(noExpenseId).get();
        assertThat(found.getExpenseTry()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleNegativeNetSavings() {
        UUID negativeId = UUID.randomUUID();
        BudgetMonth negativeMonth = BudgetMonth.builder()
                .id(negativeId)
                .month(5)
                .year(2024)
                .label("May 2024")
                .incomeTry(BigDecimal.valueOf(5000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(-2000))
                .build();

        budgetMonthRepository.save(negativeMonth);

        BudgetMonth found = budgetMonthRepository.findById(negativeId).get();
        assertThat(found.getNetSavingsTry()).isEqualByComparingTo(BigDecimal.valueOf(-2000));
    }

    @Test
    void shouldHandleLargeMonetaryValues() {
        UUID largeId = UUID.randomUUID();
        BudgetMonth largeMonth = BudgetMonth.builder()
                .id(largeId)
                .month(6)
                .year(2024)
                .label("June 2024")
                .incomeTry(BigDecimal.valueOf(999999.99))
                .expenseTry(BigDecimal.valueOf(500000.50))
                .netSavingsTry(BigDecimal.valueOf(499999.49))
                .build();

        budgetMonthRepository.save(largeMonth);

        BudgetMonth found = budgetMonthRepository.findById(largeId).get();
        assertThat(found.getIncomeTry()).isEqualByComparingTo(BigDecimal.valueOf(999999.99));
    }

    @Test
    void shouldPreserveEmptyCategoriesList() {
        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById(testMonthId).get();

        assertThat(found.getCategories()).isNotNull();
        assertThat(found.getCategories()).isEmpty();
    }

    @Test
    void shouldHandleDifferentYears() {
        UUID id2023 = UUID.randomUUID();
        UUID id2025 = UUID.randomUUID();
        BudgetMonth year2023 = BudgetMonth.builder()
                .id(id2023)
                .month(12)
                .year(2023)
                .label("December 2023")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();
        BudgetMonth year2025 = BudgetMonth.builder()
                .id(id2025)
                .month(1)
                .year(2025)
                .label("January 2025")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();

        budgetMonthRepository.save(year2023);
        budgetMonthRepository.save(year2025);

        assertThat(budgetMonthRepository.findById(id2023)).isPresent();
        assertThat(budgetMonthRepository.findById(id2025)).isPresent();
    }

    @Test
    void shouldPreserveMonthKeyAfterUpdate() {
        budgetMonthRepository.save(testBudgetMonth);
        UUID originalMonth = testBudgetMonth.getId();

        testBudgetMonth.setIncomeTry(BigDecimal.valueOf(20000));
        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth updated = budgetMonthRepository.findById(originalMonth).get();
        assertThat(updated.getYear()).isEqualTo(testBudgetMonth.getYear());
        assertThat(updated.getMonth()).isEqualTo(testBudgetMonth.getMonth());
    }
}
