package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.TransactionDto;
import com.alpeerkaraca.fintrackserver.dto.TransactionFilter;
import com.alpeerkaraca.fintrackserver.model.Transaction;
import com.alpeerkaraca.fintrackserver.repository.TransactionRepository;
import com.alpeerkaraca.fintrackserver.specifications.TransactionSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;

    public Page<Transaction> getTransactionsByUser(UUID userId, Pageable pageable) {
        return transactionRepository.findByUserProfileId(userId, pageable);
    }

    public Page<TransactionDto> getFilteredTransactions(UUID userId, TransactionFilter filter, Pageable pageable) {
        Specification<Transaction> spec = TransactionSpecifications.withFilter(userId, filter);
        Page<Transaction> entities = transactionRepository.findAll(spec, pageable);

        return entities.map(entity -> {
            return applyFilter(entity, filter);
        });
    }

    public List<TransactionDto> getFilteredTransactions(UUID userId, TransactionFilter filter) {
        Specification<Transaction> spec = TransactionSpecifications.withFilter(userId, filter);
        List<Transaction> entities = transactionRepository.findAll(spec);

        return entities.stream()
                .map(entity -> applyFilter(entity, filter))
                .toList();
    }


    private TransactionDto applyFilter(Transaction entity, TransactionFilter filter) {
        TransactionDto dto = convertToDto(entity);

        if (Boolean.TRUE.equals(entity.getIsInstallment()) && entity.getInstallmentMeta() != null) {
            YearMonth start = YearMonth.parse(entity.getInstallmentMeta().getStartMonth());
            YearMonth end = start.plusMonths(entity.getInstallmentMeta().getMonths() - 1);

            if (filter.getMonth() != null && filter.getYear() != null) {
                YearMonth target = YearMonth.of(filter.getYear(), filter.getMonth());

                if (target.isBefore(start) || target.isAfter(end)) {
                    dto.setAmountTry(BigDecimal.ZERO);
                    return dto;
                }
            }

            BigDecimal monthlyAmount = entity.getInstallmentMeta().getTotalTry()
                    .divide(BigDecimal.valueOf(entity.getInstallmentMeta().getMonths()), 2, RoundingMode.HALF_UP);

            if (filter.isExpanded()) {
                dto.setAmountTry(monthlyAmount);
            }
        }
        return dto;
    }

    private TransactionDto convertToDto(Transaction transaction) {
        return TransactionDto.builder()
                .id(transaction.getId())
                .title(transaction.getTitle())
                .amountTry(transaction.getAmountTry())
                .date(String.valueOf(transaction.getDate()))
                .category(transaction.getCategory())
                .type(transaction.getTransactionType())
                .isInstallment(transaction.getIsInstallment())
                .installmentMeta(transaction.getInstallmentMeta() != null ? transaction.getInstallmentMeta() : null)
                .build();

    }


}
