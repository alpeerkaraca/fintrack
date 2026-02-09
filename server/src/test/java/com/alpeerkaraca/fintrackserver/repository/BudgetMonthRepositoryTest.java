package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.BudgetMonth;
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
class BudgetMonthRepositoryTest {
    @Autowired
    private BudgetMonthRepository budgetMonthRepository;

    private BudgetMonth testBudgetMonth;

    @BeforeEach
    void setUp() {
        testBudgetMonth = BudgetMonth.builder()
                .monthId("2024-01")
                .label("January 2024")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();
    }

    @Test
    void shouldSaveBudgetMonth() {
        BudgetMonth saved = budgetMonthRepository.save(testBudgetMonth);

        assertThat(saved.getMonthId()).isEqualTo("2024-01");
        assertThat(saved.getLabel()).isEqualTo("January 2024");
    }

    @Test
    void shouldFindBudgetMonthById() {
        budgetMonthRepository.save(testBudgetMonth);

        Optional<BudgetMonth> found = budgetMonthRepository.findById("2024-01");

        assertThat(found).isPresent();
        assertThat(found.get().getMonthId()).isEqualTo("2024-01");
    }

    @Test
    void shouldReturnEmptyWhenBudgetMonthNotFound() {
        Optional<BudgetMonth> found = budgetMonthRepository.findById("2099-12");

        assertThat(found).isEmpty();
    }

    @Test
    void shouldDeleteBudgetMonth() {
        budgetMonthRepository.save(testBudgetMonth);

        budgetMonthRepository.deleteById("2024-01");

        Optional<BudgetMonth> found = budgetMonthRepository.findById("2024-01");
        assertThat(found).isEmpty();
    }

    @Test
    void shouldUpdateBudgetMonth() {
        budgetMonthRepository.save(testBudgetMonth);
        testBudgetMonth.setIncomeTry(BigDecimal.valueOf(15000));
        testBudgetMonth.setExpenseTry(BigDecimal.valueOf(8000));
        testBudgetMonth.setNetSavingsTry(BigDecimal.valueOf(7000));

        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth updated = budgetMonthRepository.findById("2024-01").get();
        assertThat(updated.getIncomeTry()).isEqualByComparingTo(BigDecimal.valueOf(15000));
        assertThat(updated.getExpenseTry()).isEqualByComparingTo(BigDecimal.valueOf(8000));
        assertThat(updated.getNetSavingsTry()).isEqualByComparingTo(BigDecimal.valueOf(7000));
    }

    @Test
    void shouldPreserveMonthIdentifier() {
        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById("2024-01").get();

        assertThat(found.getMonthId()).isEqualTo("2024-01");
    }

    @Test
    void shouldPreserveLabel() {
        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById("2024-01").get();

        assertThat(found.getLabel()).isEqualTo("January 2024");
    }

    @Test
    void shouldCountAllBudgetMonths() {
        budgetMonthRepository.save(testBudgetMonth);
        BudgetMonth anotherMonth = BudgetMonth.builder()
                .monthId("2024-02")
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
        BudgetMonth january = BudgetMonth.builder()
                .monthId("2024-01")
                .label("January 2024")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();
        BudgetMonth february = BudgetMonth.builder()
                .monthId("2024-02")
                .label("February 2024")
                .incomeTry(BigDecimal.valueOf(11000))
                .expenseTry(BigDecimal.valueOf(8000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();

        budgetMonthRepository.save(january);
        budgetMonthRepository.save(february);

        BudgetMonth foundJanuary = budgetMonthRepository.findById("2024-01").get();
        BudgetMonth foundFebruary = budgetMonthRepository.findById("2024-02").get();

        assertThat(foundJanuary.getIncomeTry()).isNotEqualByComparingTo(foundFebruary.getIncomeTry());
        assertThat(foundJanuary.getExpenseTry()).isNotEqualByComparingTo(foundFebruary.getExpenseTry());
    }

    @Test
    void shouldHandleZeroIncome() {
        BudgetMonth noIncomeMonth = BudgetMonth.builder()
                .monthId("2024-03")
                .label("March 2024")
                .incomeTry(BigDecimal.ZERO)
                .expenseTry(BigDecimal.valueOf(1000))
                .netSavingsTry(BigDecimal.valueOf(-1000))
                .build();

        budgetMonthRepository.save(noIncomeMonth);

        BudgetMonth found = budgetMonthRepository.findById("2024-03").get();
        assertThat(found.getIncomeTry()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleZeroExpense() {
        BudgetMonth noExpenseMonth = BudgetMonth.builder()
                .monthId("2024-04")
                .label("April 2024")
                .incomeTry(BigDecimal.valueOf(5000))
                .expenseTry(BigDecimal.ZERO)
                .netSavingsTry(BigDecimal.valueOf(5000))
                .build();

        budgetMonthRepository.save(noExpenseMonth);

        BudgetMonth found = budgetMonthRepository.findById("2024-04").get();
        assertThat(found.getExpenseTry()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleNegativeNetSavings() {
        BudgetMonth negativeMonth = BudgetMonth.builder()
                .monthId("2024-05")
                .label("May 2024")
                .incomeTry(BigDecimal.valueOf(5000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(-2000))
                .build();

        budgetMonthRepository.save(negativeMonth);

        BudgetMonth found = budgetMonthRepository.findById("2024-05").get();
        assertThat(found.getNetSavingsTry()).isEqualByComparingTo(BigDecimal.valueOf(-2000));
    }

    @Test
    void shouldHandleLargeMonetaryValues() {
        BudgetMonth largeMonth = BudgetMonth.builder()
                .monthId("2024-06")
                .label("June 2024")
                .incomeTry(BigDecimal.valueOf(999999.99))
                .expenseTry(BigDecimal.valueOf(500000.50))
                .netSavingsTry(BigDecimal.valueOf(499999.49))
                .build();

        budgetMonthRepository.save(largeMonth);

        BudgetMonth found = budgetMonthRepository.findById("2024-06").get();
        assertThat(found.getIncomeTry()).isEqualByComparingTo(BigDecimal.valueOf(999999.99));
    }

    @Test
    void shouldPreserveEmptyCategoriesList() {
        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById("2024-01").get();

        assertThat(found.getCategories()).isNotNull();
        assertThat(found.getCategories()).isEmpty();
    }

    @Test
    void shouldHandleDifferentYears() {
        BudgetMonth year2023 = BudgetMonth.builder()
                .monthId("2023-12")
                .label("December 2023")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();
        BudgetMonth year2025 = BudgetMonth.builder()
                .monthId("2025-01")
                .label("January 2025")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();

        budgetMonthRepository.save(year2023);
        budgetMonthRepository.save(year2025);

        assertThat(budgetMonthRepository.findById("2023-12")).isPresent();
        assertThat(budgetMonthRepository.findById("2025-01")).isPresent();
    }

    @Test
    void shouldPreserveMonthKeyAfterUpdate() {
        budgetMonthRepository.save(testBudgetMonth);
        String originalMonth = testBudgetMonth.getMonthId();

        testBudgetMonth.setIncomeTry(BigDecimal.valueOf(20000));
        budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth updated = budgetMonthRepository.findById(originalMonth).get();
        assertThat(updated.getMonthId()).isEqualTo(originalMonth);
    }
}
