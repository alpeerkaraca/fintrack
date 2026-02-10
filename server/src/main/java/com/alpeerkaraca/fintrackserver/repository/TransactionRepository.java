package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.PaymentMethod;
import com.alpeerkaraca.fintrackserver.model.Transaction;
import com.alpeerkaraca.fintrackserver.model.TransactionType;
import net.bytebuddy.asm.Advice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    Page<Transaction> findByUserProfileIdOrderByDateDesc(UUID userProfileId, Pageable pageable);

    Optional<Transaction> findByIdAndUserProfileId(UUID id, UUID userProfileId);

    Page<Transaction> findByUserProfileId(UUID userProfileId, Pageable pageable);

    void deleteByIdAndUserProfileId(UUID id, UUID userProfileId);

    @Query("SELECT SUM(t.amountTry) FROM Transaction t " +
            "WHERE t.userProfile.id = :userId " +
            "AND t.transactionType = :type " +
            "AND t.date >= :startDate AND t.date <= :endDate")
    Optional<BigDecimal> sumAmountByUserIdAndMonthAndYearAndType(UUID userId, LocalDate startDate, LocalDate endDate, TransactionType type);

    @Query("SELECT SUM(t.amountTry) FROM Transaction t " +
            "WHERE t.userProfile.id = :userId " +
            "AND t.paymentMethod = 'CARD' " +
            "AND t.transactionType = 'EXPENSE' " +
            "AND t.date >= :startDate AND t.date <= :endDate")
    Optional<BigDecimal> sumCardExpensesByUserIdAndPeriod(UUID userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT t FROM Transaction t " +
            "WHERE t.userProfile.id = :userId " +
            "AND t.paymentMethod = :paymentMethod " +
            "AND t.transactionType = :transactionType ")
    List<Transaction> findByUserProfileIdAndPaymentMethodAndTransactionType(UUID userId, PaymentMethod paymentMethod, TransactionType transactionType);

}
