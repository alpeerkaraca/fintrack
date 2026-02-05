package com.alpeerkaraca.fintrackserver.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetMonthRepository extends JpaRepository<BudgetMonthRepository, String> {
}
