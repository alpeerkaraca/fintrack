package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.PaymentMethod;
import com.alpeerkaraca.fintrackserver.model.Transaction;
import com.alpeerkaraca.fintrackserver.model.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class TransactionsRepositoryTest {
    @Autowired
    private TransactionRepository transactionsRepository;
    
    @Autowired
    private UserProfileRepository userProfileRepository;

    private Transaction testTransaction;
    private LocalDate today;
    private com.alpeerkaraca.fintrackserver.model.UserProfile testUserProfile;

    @BeforeEach
    void setUp() {
        today = LocalDate.now();
        
        testUserProfile = com.alpeerkaraca.fintrackserver.model.UserProfile.builder()
                .username("testuser")
                .email("test@fintrack.com")
                .password("usertestpasswordsisherebutshouldbereplacedwithhash")
                .netSalaryUsd(BigDecimal.valueOf(1000))
                .creditCardLimitTry(BigDecimal.valueOf(1000))
                .build();
        testUserProfile = userProfileRepository.save(testUserProfile);
        
        testTransaction = Transaction.builder()
                .title("Grocery Shopping")
                .amountTry(BigDecimal.valueOf(250))
                .date(today)
                .category("Food")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CARD)
                .userProfile(testUserProfile)
                .build();
    }

    @Test
    void shouldSaveTransaction() {
        Transaction saved = transactionsRepository.save(testTransaction);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTitle()).isEqualTo("Grocery Shopping");
    }

    @Test
    void shouldFindTransactionById() {
        Transaction saved = transactionsRepository.save(testTransaction);

        Optional<Transaction> found = transactionsRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void shouldReturnEmptyWhenTransactionNotFound() {
        Optional<Transaction> found = transactionsRepository.findById(UUID.randomUUID());

        assertThat(found).isEmpty();
    }

    @Test
    void shouldDeleteTransaction() {
        Transaction saved = transactionsRepository.save(testTransaction);

        transactionsRepository.deleteById(saved.getId());

        Optional<Transaction> found = transactionsRepository.findById(saved.getId());
        assertThat(found).isEmpty();
    }

    @Test
    void shouldUpdateTransaction() {
        Transaction saved = transactionsRepository.save(testTransaction);
        saved.setTitle("Updated Title");
        saved.setAmountTry(BigDecimal.valueOf(300));

        transactionsRepository.save(saved);

        Transaction updated = transactionsRepository.findById(saved.getId()).get();
        assertThat(updated.getTitle()).isEqualTo("Updated Title");
        assertThat(updated.getAmountTry()).isEqualByComparingTo(BigDecimal.valueOf(300));
    }

    @Test
    void shouldPreserveTransactionTitle() {
        transactionsRepository.save(testTransaction);

        Transaction found = transactionsRepository.findById(testTransaction.getId()).get();

        assertThat(found.getTitle()).isEqualTo("Grocery Shopping");
    }

    @Test
    void shouldPreserveAmount() {
        transactionsRepository.save(testTransaction);

        Transaction found = transactionsRepository.findById(testTransaction.getId()).get();

        assertThat(found.getAmountTry()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void shouldPreserveTransactionDate() {
        transactionsRepository.save(testTransaction);

        Transaction found = transactionsRepository.findById(testTransaction.getId()).get();

        assertThat(found.getDate()).isEqualTo(today);
    }

    @Test
    void shouldPreserveCategory() {
        transactionsRepository.save(testTransaction);

        Transaction found = transactionsRepository.findById(testTransaction.getId()).get();

        assertThat(found.getCategory()).isEqualTo("Food");
    }

    @Test
    void shouldPreserveTransactionType() {
        transactionsRepository.save(testTransaction);

        Transaction found = transactionsRepository.findById(testTransaction.getId()).get();

        assertThat(found.getTransactionType()).isEqualTo(TransactionType.EXPENSE);
    }

    @Test
    void shouldPreservePaymentMethod() {
        transactionsRepository.save(testTransaction);

        Transaction found = transactionsRepository.findById(testTransaction.getId()).get();

        assertThat(found.getPaymentMethod()).isEqualTo(PaymentMethod.CARD);
    }

    @Test
    void shouldCountAllTransactions() {
        transactionsRepository.save(testTransaction);
        Transaction anotherTransaction = Transaction.builder()
                .userProfile(testUserProfile)
                .title("Restaurant")
                .amountTry(BigDecimal.valueOf(100))
                .date(today)
                .category("Dining")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CARD)
                .build();
        transactionsRepository.save(anotherTransaction);

        long count = transactionsRepository.count();

        assertThat(count).isGreaterThanOrEqualTo(2);
    }

    @Test
    void shouldHandleIncomeTransactions() {
        Transaction incomeTransaction = Transaction.builder()
                .title("Salary")
                .amountTry(BigDecimal.valueOf(5000))
                .date(today)
                .category("Salary")
                .transactionType(TransactionType.INCOME)
                .paymentMethod(PaymentMethod.TRANSFER)
                .build();

        Transaction saved = transactionsRepository.save(incomeTransaction);

        Transaction found = transactionsRepository.findById(saved.getId()).get();
        assertThat(found.getTransactionType()).isEqualTo(TransactionType.INCOME);
    }

    @Test
    void shouldHandleExpenseTransactions() {
        Transaction expenseTransaction = Transaction.builder()
                .title("Gas")
                .amountTry(BigDecimal.valueOf(75))
                .date(today)
                .category("Transport")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CASH)
                .build();

        Transaction saved = transactionsRepository.save(expenseTransaction);

        Transaction found = transactionsRepository.findById(saved.getId()).get();
        assertThat(found.getTransactionType()).isEqualTo(TransactionType.EXPENSE);
    }

    @Test
    void shouldHandleNullPaymentMethod() {
        Transaction transactionWithoutPayment = Transaction.builder()
                .title("Purchase")
                .amountTry(BigDecimal.valueOf(500))
                .date(today)
                .category("Shopping")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(null)
                .build();

        Transaction saved = transactionsRepository.save(transactionWithoutPayment);

        Transaction found = transactionsRepository.findById(saved.getId()).get();
        assertThat(found.getPaymentMethod()).isNull();
    }

    @Test
    void shouldHandleDifferentPaymentMethods() {
        Transaction cashTransaction = Transaction.builder()
                .title("Cash Purchase")
                .amountTry(BigDecimal.valueOf(50))
                .date(today)
                .category("Shopping")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CASH)
                .build();
        Transaction creditCardTransaction = Transaction.builder()
                .title("Card Purchase")
                .amountTry(BigDecimal.valueOf(200))
                .date(today)
                .category("Electronics")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CARD)
                .build();

        Transaction savedCash = transactionsRepository.save(cashTransaction);
        Transaction savedCard = transactionsRepository.save(creditCardTransaction);

        Transaction foundCash = transactionsRepository.findById(savedCash.getId()).get();
        Transaction foundCard = transactionsRepository.findById(savedCard.getId()).get();

        assertThat(foundCash.getPaymentMethod()).isEqualTo(PaymentMethod.CASH);
        assertThat(foundCard.getPaymentMethod()).isEqualTo(PaymentMethod.CARD);
    }

    @Test
    void shouldHandleZeroAmount() {
        Transaction zeroTransaction = Transaction.builder()
                .title("Adjustment")
                .amountTry(BigDecimal.ZERO)
                .date(today)
                .category("Other")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CASH)
                .build();

        Transaction saved = transactionsRepository.save(zeroTransaction);

        Transaction found = transactionsRepository.findById(saved.getId()).get();
        assertThat(found.getAmountTry()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void shouldHandleLargeAmounts() {
        Transaction largeTransaction = Transaction.builder()
                .title("Property Purchase")
                .amountTry(BigDecimal.valueOf(999999.99))
                .date(today)
                .category("Real Estate")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CARD)
                .build();

        Transaction saved = transactionsRepository.save(largeTransaction);

        Transaction found = transactionsRepository.findById(saved.getId()).get();
        assertThat(found.getAmountTry()).isEqualByComparingTo(BigDecimal.valueOf(999999.99));
    }

    @Test
    void shouldHandlePastDates() {
        LocalDate pastDate = today.minusMonths(6);
        Transaction pastTransaction = Transaction.builder()
                .title("Past Purchase")
                .amountTry(BigDecimal.valueOf(100))
                .date(pastDate)
                .category("Shopping")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CASH)
                .build();

        Transaction saved = transactionsRepository.save(pastTransaction);

        Transaction found = transactionsRepository.findById(saved.getId()).get();
        assertThat(found.getDate()).isEqualTo(pastDate);
    }

    @Test
    void shouldHandleFutureDates() {
        LocalDate futureDate = today.plusMonths(1);
        Transaction futureTransaction = Transaction.builder()
                .title("Planned Expense")
                .amountTry(BigDecimal.valueOf(500))
                .date(futureDate)
                .category("Shopping")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CARD)
                .build();

        Transaction saved = transactionsRepository.save(futureTransaction);

        Transaction found = transactionsRepository.findById(saved.getId()).get();
        assertThat(found.getDate()).isEqualTo(futureDate);
    }

    @Test
    void shouldDistinguishBetweenMultipleTransactions() {
        Transaction transaction1 = Transaction.builder()
                .title("Transaction 1")
                .amountTry(BigDecimal.valueOf(100))
                .date(today)
                .category("Category 1")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CASH)
                .build();
        Transaction transaction2 = Transaction.builder()
                .title("Transaction 2")
                .amountTry(BigDecimal.valueOf(500))
                .date(today)
                .category("Category 2")
                .transactionType(TransactionType.INCOME)
                .paymentMethod(PaymentMethod.TRANSFER)
                .build();

        Transaction saved1 = transactionsRepository.save(transaction1);
        Transaction saved2 = transactionsRepository.save(transaction2);

        Transaction found1 = transactionsRepository.findById(saved1.getId()).get();
        Transaction found2 = transactionsRepository.findById(saved2.getId()).get();

        assertThat(found1.getTitle()).isNotEqualTo(found2.getTitle());
        assertThat(found1.getAmountTry()).isNotEqualByComparingTo(found2.getAmountTry());
        assertThat(found1.getTransactionType()).isNotEqualTo(found2.getTransactionType());
    }

    @Test
    void shouldPreserveIdAfterUpdate() {
        Transaction saved = transactionsRepository.save(testTransaction);
        UUID originalId = saved.getId();

        saved.setTitle("Updated Title");
        transactionsRepository.save(saved);

        Transaction updated = transactionsRepository.findById(originalId).get();
        assertThat(updated.getId()).isEqualTo(originalId);
    }

    @Test
    void shouldHandleDecimalAmounts() {
        Transaction decimalTransaction = Transaction.builder()
                .title("Precise Amount")
                .amountTry(BigDecimal.valueOf(123.45))
                .date(today)
                .category("Precise")
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CARD)
                .build();

        Transaction saved = transactionsRepository.save(decimalTransaction);

        Transaction found = transactionsRepository.findById(saved.getId()).get();
        assertThat(found.getAmountTry()).isEqualByComparingTo(BigDecimal.valueOf(123.45));
    }
}
