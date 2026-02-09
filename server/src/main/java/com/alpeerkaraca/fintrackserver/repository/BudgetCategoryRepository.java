package com.alpeerkaraca.fintrackserver.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.alpeerkaraca.fintrackserver.model.BudgetCategory;

@Repository
public interface BudgetCategoryRepository extends JpaRepository<BudgetCategory, UUID> {

    @Query("SELECT bc FROM BudgetCategory bc WHERE bc.userProfile.id = :userId")
    List<BudgetCategory> findByUserId(UUID userId);

}
