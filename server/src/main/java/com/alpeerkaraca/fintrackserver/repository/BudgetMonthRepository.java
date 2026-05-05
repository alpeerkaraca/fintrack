package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.BudgetMonth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetMonthRepository extends JpaRepository<BudgetMonth, UUID> {
        Optional<BudgetMonth> findByUserProfileIdAndMonthAndYear(UUID userId, Integer month, Integer year);

        @Query(value = "SELECT DISTINCT year, month FROM budget_months WHERE user_profile_id = :userId", nativeQuery = true)
        List<Object[]> findDistinctBudgetMonths(@org.springframework.data.repository.query.Param("userId") UUID userId);

        UUID id(UUID id);
        @Query(value = "SELECT uuidv7()", nativeQuery = true)
        UUID generateUuidv7();
}
