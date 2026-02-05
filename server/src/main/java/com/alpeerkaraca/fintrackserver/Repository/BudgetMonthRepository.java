package com.alpeerkaraca.fintrackserver.Repository;

import com.alpeerkaraca.fintrackserver.Model.BudgetMonth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetMonthRepository extends JpaRepository<BudgetMonth, String> {
}
