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
    
    @Autowired
    private UserProfileRepository userProfileRepository;

    private BudgetMonth testBudgetMonth;
    private UserProfile testUserProfile;
    
    @BeforeEach
    void setUp() {
        testUserProfile = UserProfile.builder()
                .username("testuser")
                .email("test@fintrack.com")
                .password("usertestpasswordsisherebutshouldbereplacedwithhash")
                .netSalaryUsd(BigDecimal.valueOf(1000))
                .creditCardLimitTry(BigDecimal.valueOf(1000))
                .build();
        // Save the user profile first
        testUserProfile = userProfileRepository.save(testUserProfile);
        
        testBudgetMonth = BudgetMonth.builder()
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
        BudgetMonth saved = budgetMonthRepository.save(testBudgetMonth);

        Optional<BudgetMonth> found = budgetMonthRepository.findById(saved.getId());

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
        BudgetMonth saved = budgetMonthRepository.save(testBudgetMonth);

        budgetMonthRepository.deleteById(saved.getId());

        Optional<BudgetMonth> found = budgetMonthRepository.findById(saved.getId());
        assertThat(found).isEmpty();
    }

    @Test
    void shouldUpdateBudgetMonth() {
        BudgetMonth saved = budgetMonthRepository.save(testBudgetMonth);
        saved.setIncomeTry(BigDecimal.valueOf(15000));
        saved.setExpenseTry(BigDecimal.valueOf(8000));
        saved.setNetSavingsTry(BigDecimal.valueOf(7000));

        budgetMonthRepository.save(saved);

        BudgetMonth updated = budgetMonthRepository.findById(saved.getId()).get();
        assertThat(updated.getIncomeTry()).isEqualByComparingTo(BigDecimal.valueOf(15000));
        assertThat(updated.getExpenseTry()).isEqualByComparingTo(BigDecimal.valueOf(8000));
        assertThat(updated.getNetSavingsTry()).isEqualByComparingTo(BigDecimal.valueOf(7000));
    }

    @Test
    void shouldPreserveMonthIdentifier() {
        BudgetMonth saved = budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById(saved.getId()).get();

        assertThat(found.getMonth()).isEqualTo(1);
        assertThat(found.getYear()).isEqualTo(2024);
    }

    @Test
    void shouldPreserveLabel() {
        BudgetMonth saved = budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById(saved.getId()).get();

        assertThat(found.getLabel()).isEqualTo("January 2024");
    }

    @Test
    void shouldCountAllBudgetMonths() {
        budgetMonthRepository.save(testBudgetMonth);
        BudgetMonth anotherMonth = BudgetMonth.builder()
                .userProfile(testUserProfile)
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
        BudgetMonth january = BudgetMonth.builder()
                .userProfile(testUserProfile)
                .month(1)
                .year(2024)
                .label("January 2024")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();
        BudgetMonth february = BudgetMonth.builder()
                .userProfile(testUserProfile)
                .month(2)
                .year(2024)
                .label("February 2024")
                .incomeTry(BigDecimal.valueOf(11000))
                .expenseTry(BigDecimal.valueOf(8000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();

        BudgetMonth savedJan = budgetMonthRepository.save(january);
        BudgetMonth savedFeb = budgetMonthRepository.save(february);

        BudgetMonth foundJanuary = budgetMonthRepository.findById(savedJan.getId()).get();
        BudgetMonth foundFebruary = budgetMonthRepository.findById(savedFeb.getId()).get();

        assertThat(foundJanuary.getIncomeTry()).isNotEqualByComparingTo(foundFebruary.getIncomeTry());
        assertThat(foundJanuary.getExpenseTry()).isNotEqualByComparingTo(foundFebruary.getExpenseTry());
    }

    @Test
    void shouldHandleZeroIncome() {
        BudgetMonth noIncomeMonth = BudgetMonth.builder()
                .userProfile(testUserProfile)
                .month(3)
                .year(2024)
                .label("March 2024")
                .incomeTry(BigDecimal.ZERO)
                .expenseTry(BigDecimal.valueOf(1000))
                .netSavingsTry(BigDecimal.valueOf(-1000))
                .build();

        BudgetMonth saved = budgetMonthRepository.save(noIncomeMonth);

        BudgetMonth found = budgetMonthRepository.findById(saved.getId()).get();
        assertThat(found.getIncomeTry()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleZeroExpense() {
        BudgetMonth noExpenseMonth = BudgetMonth.builder()
                .userProfile(testUserProfile)
                .month(4)
                .year(2024)
                .label("April 2024")
                .incomeTry(BigDecimal.valueOf(5000))
                .expenseTry(BigDecimal.ZERO)
                .netSavingsTry(BigDecimal.valueOf(5000))
                .build();

        BudgetMonth saved = budgetMonthRepository.save(noExpenseMonth);

        BudgetMonth found = budgetMonthRepository.findById(saved.getId()).get();
        assertThat(found.getExpenseTry()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleNegativeNetSavings() {
        BudgetMonth negativeMonth = BudgetMonth.builder()
                .userProfile(testUserProfile)
                .month(5)
                .year(2024)
                .label("May 2024")
                .incomeTry(BigDecimal.valueOf(5000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(-2000))
                .build();

        BudgetMonth saved = budgetMonthRepository.save(negativeMonth);

        BudgetMonth found = budgetMonthRepository.findById(saved.getId()).get();
        assertThat(found.getNetSavingsTry()).isEqualByComparingTo(BigDecimal.valueOf(-2000));
    }

    @Test
    void shouldHandleLargeMonetaryValues() {
        BudgetMonth largeMonth = BudgetMonth.builder()
                .userProfile(testUserProfile)
                .month(6)
                .year(2024)
                .label("June 2024")
                .incomeTry(BigDecimal.valueOf(999999.99))
                .expenseTry(BigDecimal.valueOf(500000.50))
                .netSavingsTry(BigDecimal.valueOf(499999.49))
                .build();

        BudgetMonth saved = budgetMonthRepository.save(largeMonth);

        BudgetMonth found = budgetMonthRepository.findById(saved.getId()).get();
        assertThat(found.getIncomeTry()).isEqualByComparingTo(BigDecimal.valueOf(999999.99));
    }

    @Test
    void shouldPreserveEmptyCategoriesList() {
        BudgetMonth saved = budgetMonthRepository.save(testBudgetMonth);

        BudgetMonth found = budgetMonthRepository.findById(saved.getId()).get();

        assertThat(found.getCategories()).isNotNull();
        assertThat(found.getCategories()).isEmpty();
    }

    @Test
    void shouldHandleDifferentYears() {
        BudgetMonth year2023 = BudgetMonth.builder()
                .userProfile(testUserProfile)
                .month(12)
                .year(2023)
                .label("December 2023")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();
        BudgetMonth year2025 = BudgetMonth.builder()
                .userProfile(testUserProfile)
                .month(1)
                .year(2025)
                .label("January 2025")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .build();

        BudgetMonth saved2023 = budgetMonthRepository.save(year2023);
        BudgetMonth saved2025 = budgetMonthRepository.save(year2025);

        assertThat(budgetMonthRepository.findById(saved2023.getId())).isPresent();
        assertThat(budgetMonthRepository.findById(saved2025.getId())).isPresent();
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
