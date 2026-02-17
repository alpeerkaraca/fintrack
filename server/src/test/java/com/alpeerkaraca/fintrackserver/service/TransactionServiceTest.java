package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.TransactionDto;
import com.alpeerkaraca.fintrackserver.dto.TransactionFilter;
import com.alpeerkaraca.fintrackserver.model.*;
import com.alpeerkaraca.fintrackserver.repository.TransactionRepository;
import com.alpeerkaraca.fintrackserver.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private TransactionService transactionService;

    private UUID testUserId;
    private UserProfile testUser;
    private Transaction testTransaction;
    private Pageable testPageable;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        testUser = UserProfile.builder()
                .id(testUserId)
                .username("testuser")
                .email("test@test.com")
                .build();

        testTransaction = Transaction.builder()
                .id(UUID.randomUUID())
                .userProfile(testUser)
                .title("Test Transaction")
                .amountTry(BigDecimal.valueOf(100))
                .date(LocalDate.now())
                .category(Category.FOOD)
                .transactionType(TransactionType.EXPENSE)
                .paymentMethod(PaymentMethod.CASH)
                .build();

        testPageable = PageRequest.of(0, 10);
    }

    @Test
    void shouldGetTransactionsByUser() {
        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findByUserProfileId(testUserId, testPageable)).thenReturn(page);

        Page<Transaction> result = transactionService.getTransactionsByUser(testUserId, testPageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Transaction");
        verify(transactionRepository).findByUserProfileId(testUserId, testPageable);
    }

    @Test
    void shouldGetFilteredTransactions() {
        TransactionFilter filter = TransactionFilter.builder()
                .month(1)
                .year(2024)
                .expanded(true)
                .build();

        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        Page<TransactionDto> result = transactionService.getFilteredTransactions(testUserId, filter, testPageable, true);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(transactionRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void shouldReturnEmptyPageWhenNoTransactions() {
        Page<Transaction> emptyPage = new PageImpl<>(Collections.emptyList());
        when(transactionRepository.findByUserProfileId(testUserId, testPageable)).thenReturn(emptyPage);

        Page<Transaction> result = transactionService.getTransactionsByUser(testUserId, testPageable);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void shouldFilterByMonthAndYear() {
        TransactionFilter filter = TransactionFilter.builder()
                .month(6)
                .year(2024)
                .build();

        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        transactionService.getFilteredTransactions(testUserId, filter, testPageable, false);

        verify(transactionRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void shouldFilterByCategory() {
        TransactionFilter filter = TransactionFilter.builder()
                .category("Food")
                .build();

        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        Page<TransactionDto> result = transactionService.getFilteredTransactions(testUserId, filter, testPageable, false);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void shouldFilterByTransactionType() {
        TransactionFilter filter = TransactionFilter.builder()
                .type(TransactionType.EXPENSE)
                .build();

        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        Page<TransactionDto> result = transactionService.getFilteredTransactions(testUserId, filter, testPageable, false);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void shouldNotChangePageableWhenAlreadySorted() {
        Pageable sortedPageable = PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("date").ascending());
        TransactionFilter filter = TransactionFilter.builder().build();

        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        transactionService.getFilteredTransactions(testUserId, filter, sortedPageable, true);

        verify(transactionRepository).findAll(any(Specification.class), eq(sortedPageable));
    }

    @Test
    void shouldHandleNullFilter() {
        TransactionFilter filter = TransactionFilter.builder().build();

        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        Page<TransactionDto> result = transactionService.getFilteredTransactions(testUserId, filter, testPageable, false);

        assertThat(result).isNotNull();
    }

    @Test
    void shouldHandlePagination() {
        Pageable page2 = PageRequest.of(1, 5);
        Page<Transaction> transactionPage = new PageImpl<>(
                Arrays.asList(testTransaction),
                page2,
                10
        );

        when(transactionRepository.findByUserProfileId(testUserId, page2))
                .thenReturn(transactionPage);

        Page<Transaction> result = transactionService.getTransactionsByUser(testUserId, page2);

        assertThat(result.getTotalPages()).isEqualTo(2);
        assertThat(result.getTotalElements()).isEqualTo(10);
        assertThat(result.getNumber()).isEqualTo(1);
    }

    @Test
    void shouldConvertToDto() {
        TransactionFilter filter = TransactionFilter.builder().build();
        
        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        Page<TransactionDto> result = transactionService.getFilteredTransactions(testUserId, filter, testPageable, false);

        assertThat(result.getContent().get(0)).isInstanceOf(TransactionDto.class);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Transaction");
        assertThat(result.getContent().get(0).getAmountTry()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void shouldHandleMultipleFilters() {
        TransactionFilter filter = TransactionFilter.builder()
                .month(5)
                .year(2024)
                .category("Food")
                .type(TransactionType.EXPENSE)
                .expanded(true)
                .build();

        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        Page<TransactionDto> result = transactionService.getFilteredTransactions(testUserId, filter, testPageable, false);

        assertThat(result).isNotNull();
        verify(transactionRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void shouldHandleLargePageSize() {
        Pageable largePageable = PageRequest.of(0, 100);
        Page<Transaction> page = new PageImpl<>(Collections.emptyList());
        
        when(transactionRepository.findByUserProfileId(testUserId, largePageable))
                .thenReturn(page);

        Page<Transaction> result = transactionService.getTransactionsByUser(testUserId, largePageable);

        assertThat(result).isNotNull();
        verify(transactionRepository).findByUserProfileId(testUserId, largePageable);
    }

    @Test
    void shouldHandleExpandedFlag() {
        TransactionFilter filterExpanded = TransactionFilter.builder()
                .expanded(true)
                .build();

        TransactionFilter filterNotExpanded = TransactionFilter.builder()
                .expanded(false)
                .build();

        Page<Transaction> page = new PageImpl<>(Arrays.asList(testTransaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        transactionService.getFilteredTransactions(testUserId, filterExpanded, testPageable, false);
        transactionService.getFilteredTransactions(testUserId, filterNotExpanded, testPageable, false);

        verify(transactionRepository, times(2)).findAll(any(Specification.class), any(Pageable.class));
    }
}
