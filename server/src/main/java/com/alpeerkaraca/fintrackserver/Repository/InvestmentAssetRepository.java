package com.alpeerkaraca.fintrackserver.Repository;

import com.alpeerkaraca.fintrackserver.Model.InvestmentAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvestmentAssetRepository extends JpaRepository<InvestmentAsset, String> {
}
