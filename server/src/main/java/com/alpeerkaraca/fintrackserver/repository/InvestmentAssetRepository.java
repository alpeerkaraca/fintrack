package com.alpeerkaraca.fintrackserver.repository;

import com.alpeerkaraca.fintrackserver.model.InvestmentAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvestmentAssetRepository extends JpaRepository<InvestmentAsset, UUID> {
    List<InvestmentAsset> findByUserProfileId(UUID userProfileId);
    boolean existsByUserProfileIdAndSymbol(UUID userProfileId, String symbol);
    Optional<InvestmentAsset> findByIdAndUserProfileId(UUID id, UUID userProfileId);
}
