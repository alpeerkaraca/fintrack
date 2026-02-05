package com.alpeerkaraca.fintrackserver.Repository;

import com.alpeerkaraca.fintrackserver.Model.Transactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TransactionsRepository extends JpaRepository<Transactions, UUID> {
}
