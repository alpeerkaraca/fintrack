package com.alpeerkaraca.fintrackserver.specifications;

import com.alpeerkaraca.fintrackserver.dto.TransactionFilter;
import com.alpeerkaraca.fintrackserver.model.Transaction;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class TransactionSpecifications {
    /**
     * Builds a JPA Specification for {@link Transaction} using the provided filter criteria.
     *
     * The returned specification always restricts results to the given {@code userId}.
     * Supported filter options:
     *  - type: when {@code filter.getType()} is not null, matches {@code transactionType}.
     *  - category: when provided (non-blank), matches {@code category} case-insensitively.
     *  - month & year: when both {@code filter.getMonth()} and {@code filter.getYear()} are provided,
     *    non-installment transactions with matching YEAR/MONTH are included.
     *  - expanded: if {@code filter.isExpanded()} is true, installment transactions whose
     *    {@code installmentMeta.startMonth} is less than or equal to the target month (formatted
     *    as "YYYY-MM") are also included.
     *
     * Notes:
     *  - The method composes predicates and returns them combined with a logical AND.
     *  - Uses database MONTH/YEAR functions for month/year comparison on the {@code date} field.
     *
     * @param userId the id of the user to restrict transactions to
     * @param filter the filter DTO containing criteria to apply
     * @return a Specification\<Transaction\> that applies the provided filters
     */
    public static Specification<Transaction> withFilter(UUID userId, TransactionFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("userProfile").get("id"), userId));

            if (filter.getType() != null) {
                predicates.add(cb.equal(root.get("transactionType"), filter.getType()));
            }

            if (filter.getCategory() != null && !filter.getCategory().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), filter.getCategory().toLowerCase()));
            }

            if (filter.getMonth() != null && filter.getYear() != null) {
                // Hedeflenen ayın başlangıç ve bitiş tarihlerini hesapla
                LocalDate targetStart = LocalDate.of(filter.getYear(), filter.getMonth(), 1);
                LocalDate targetEnd = targetStart.withDayOfMonth(targetStart.lengthOfMonth());

                Predicate normalTransactions = cb.and(
                        cb.equal(cb.function("MONTH", Integer.class, root.get("date")), filter.getMonth()),
                        cb.equal(cb.function("YEAR", Integer.class, root.get("date")), filter.getYear()),
                        cb.isFalse(root.get("isInstallment")) // Taksitli olmayanlar
                );

                if (filter.isExpanded()) {
                    String targetMonthStr = String.format("%04d-%02d", filter.getYear(), filter.getMonth());

                    Predicate installmentActive = cb.and(
                            cb.isTrue(root.get("isInstallment")),
                            cb.lessThanOrEqualTo(root.get("installmentMeta").get("startMonth"), targetMonthStr)
                    );

                    predicates.add(cb.or(normalTransactions, installmentActive));
                } else {
                    predicates.add(normalTransactions);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}