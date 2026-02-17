package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.BudgetCategory;
import com.alpeerkaraca.fintrackserver.model.BudgetMonth;
import com.alpeerkaraca.fintrackserver.model.Category;
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
class BudgetCategoryRepositoryTest {
    @Autowired
    private BudgetCategoryRepository budgetCategoryRepository;

    @Autowired
    private BudgetMonthRepository budgetMonthRepository;
    
    @Autowired
    private UserProfileRepository userProfileRepository;

    private BudgetMonth testBudgetMonth;
    private BudgetCategory testCategory;
    private com.alpeerkaraca.fintrackserver.model.UserProfile testUserProfile;

    @BeforeEach
    void setUp() {
        testUserProfile = com.alpeerkaraca.fintrackserver.model.UserProfile.builder()
                .username("testuser")
                .email("test@fintrack.com")
                .password("usertestpasswordsisherebutshouldbereplacedwithhash")
                .netSalaryUsd(BigDecimal.valueOf(1000))
                .creditCardLimitTry(BigDecimal.valueOf(1000))
                .build();
        testUserProfile = userProfileRepository.save(testUserProfile);
        
        testBudgetMonth = BudgetMonth.builder()
                .year(2024)
                .month(1)
                .label("January 2024")
                .incomeTry(BigDecimal.valueOf(10000))
                .expenseTry(BigDecimal.valueOf(7000))
                .netSavingsTry(BigDecimal.valueOf(3000))
                .userProfile(testUserProfile)
                .build();
        testBudgetMonth = budgetMonthRepository.save(testBudgetMonth);

        testCategory = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .userProfile(testUserProfile)
                .category(Category.FOOD)
                .limitTry(BigDecimal.valueOf(1000))
                .spentTry(BigDecimal.valueOf(800))
                .build();
    }

    @Test
    void shouldSaveBudgetCategory() {
        BudgetCategory saved = budgetCategoryRepository.save(testCategory);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCategory()).isEqualTo("Food");
    }

    @Test
    void shouldFindCategoryById() {
        BudgetCategory saved = budgetCategoryRepository.save(testCategory);

        Optional<BudgetCategory> found = budgetCategoryRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void shouldReturnEmptyWhenCategoryNotFound() {
        Optional<BudgetCategory> found = budgetCategoryRepository.findById(UUID.randomUUID());

        assertThat(found).isEmpty();
    }

    @Test
    void shouldDeleteBudgetCategory() {
        BudgetCategory saved = budgetCategoryRepository.save(testCategory);

        budgetCategoryRepository.deleteById(saved.getId());

        Optional<BudgetCategory> found = budgetCategoryRepository.findById(saved.getId());
        assertThat(found).isEmpty();
    }

    @Test
    void shouldUpdateBudgetCategory() {
        BudgetCategory saved = budgetCategoryRepository.save(testCategory);
        saved.setLimitTry(BigDecimal.valueOf(1500));
        saved.setSpentTry(BigDecimal.valueOf(900));

        budgetCategoryRepository.save(saved);

        BudgetCategory updated = budgetCategoryRepository.findById(saved.getId()).get();
        assertThat(updated.getLimitTry()).isEqualByComparingTo(BigDecimal.valueOf(1500));
        assertThat(updated.getSpentTry()).isEqualByComparingTo(BigDecimal.valueOf(900));
    }

    @Test
    void shouldPreserveBudgetMonthReference() {
        BudgetCategory saved = budgetCategoryRepository.save(testCategory);

        BudgetCategory found = budgetCategoryRepository.findById(saved.getId()).get();

        assertThat(found.getBudgetMonth()).isNotNull();
        assertThat(found.getBudgetMonth().getYear()).isEqualTo(2024);
        assertThat(found.getBudgetMonth().getMonth()).isEqualTo(1);
    }

    @Test
    void shouldPreserveCategoryName() {
        budgetCategoryRepository.save(testCategory);

        BudgetCategory found = budgetCategoryRepository.findById(testCategory.getId()).get();

        assertThat(found.getCategory()).isEqualTo(Category.FOOD);
    }

    @Test
    void shouldCountAllCategories() {
        budgetCategoryRepository.save(testCategory);
        BudgetCategory anotherCategory = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .userProfile(testUserProfile)
                .category(Category.TRANSPORT)
                .limitTry(BigDecimal.valueOf(500))
                .spentTry(BigDecimal.valueOf(400))
                .build();
        budgetCategoryRepository.save(anotherCategory);

        long count = budgetCategoryRepository.count();

        assertThat(count).isGreaterThanOrEqualTo(2);
    }

    @Test
    void shouldHandleMultipleCategoriesForSameBudgetMonth() {
        BudgetCategory category1 = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .userProfile(testUserProfile)
                .category(Category.FOOD)
                .limitTry(BigDecimal.valueOf(1000))
                .spentTry(BigDecimal.valueOf(800))
                .build();
        BudgetCategory category2 = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .userProfile(testUserProfile)
                .category(Category.TRANSPORT)
                .limitTry(BigDecimal.valueOf(500))
                .spentTry(BigDecimal.valueOf(400))
                .build();

        budgetCategoryRepository.save(category1);
        budgetCategoryRepository.save(category2);

        long count = budgetCategoryRepository.count();
        assertThat(count).isGreaterThanOrEqualTo(2);
    }

    @Test
    void shouldDistinguishBetweenDifferentCategories() {
        BudgetCategory foodCategory = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .userProfile(testUserProfile)
                .category(Category.FOOD)
                .limitTry(BigDecimal.valueOf(1000))
                .spentTry(BigDecimal.valueOf(800))
                .build();
        BudgetCategory entertainmentCategory = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .userProfile(testUserProfile)
                .category(Category.ENTERTAINMENT)
                .limitTry(BigDecimal.valueOf(300))
                .spentTry(BigDecimal.valueOf(250))
                .build();

        BudgetCategory savedFood = budgetCategoryRepository.save(foodCategory);
        BudgetCategory savedEntertainment = budgetCategoryRepository.save(entertainmentCategory);

        BudgetCategory foundFood = budgetCategoryRepository.findById(savedFood.getId()).get();
        BudgetCategory foundEntertainment = budgetCategoryRepository.findById(savedEntertainment.getId()).get();

        assertThat(foundFood.getCategory().getLabel()).isEqualTo("Food");
        assertThat(foundEntertainment.getCategory().getLabel()).isEqualTo("Entertainment");
        assertThat(foundFood.getLimitTry()).isNotEqualByComparingTo(foundEntertainment.getLimitTry());
    }

    @Test
    void shouldHandleZeroSpentAmount() {
        BudgetCategory categoryNoSpend = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .category(Category.SAVINGS)
                .limitTry(BigDecimal.valueOf(2000))
                .spentTry(BigDecimal.ZERO)
                .build();

        BudgetCategory saved = budgetCategoryRepository.save(categoryNoSpend);

        BudgetCategory found = budgetCategoryRepository.findById(saved.getId()).get();
        assertThat(found.getSpentTry()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleSpentEqualToLimit() {
        BudgetCategory maxSpendCategory = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .category(Category.SHOPPING)
                .limitTry(BigDecimal.valueOf(1000))
                .spentTry(BigDecimal.valueOf(1000))
                .build();

        BudgetCategory saved = budgetCategoryRepository.save(maxSpendCategory);

        BudgetCategory found = budgetCategoryRepository.findById(saved.getId()).get();
        assertThat(found.getSpentTry()).isEqualByComparingTo(found.getLimitTry());
    }

    @Test
    void shouldHandleLargeMonetaryValues() {
        BudgetCategory largeCategory = BudgetCategory.builder()
                .budgetMonth(testBudgetMonth)
                .category(Category.INVESTMENT)
                .limitTry(BigDecimal.valueOf(999999.99))
                .spentTry(BigDecimal.valueOf(500000.00))
                .build();

        BudgetCategory saved = budgetCategoryRepository.save(largeCategory);

        BudgetCategory found = budgetCategoryRepository.findById(saved.getId()).get();
        assertThat(found.getLimitTry()).isEqualByComparingTo(BigDecimal.valueOf(999999.99));
    }

    @Test
    void shouldPreserveIdAfterUpdate() {
        BudgetCategory saved = budgetCategoryRepository.save(testCategory);
        UUID originalId = saved.getId();

        saved.setLimitTry(BigDecimal.valueOf(2000));
        budgetCategoryRepository.save(saved);

        BudgetCategory updated = budgetCategoryRepository.findById(originalId).get();
        assertThat(updated.getId()).isEqualTo(originalId);
    }
}
