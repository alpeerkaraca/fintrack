package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.BudgetMonth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetMonthRepository extends JpaRepository<BudgetMonth, UUID> {
        Optional<BudgetMonth> findByUserProfileIdAndMonthAndYear(UUID userId, Integer month, Integer year);

        UUID id(UUID id);
}
