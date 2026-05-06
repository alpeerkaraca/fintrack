package com.alpeerkaraca.fintrackserver.service;

import com.alpeerkaraca.fintrackserver.dto.SavingsGoalCreateRequest;
import com.alpeerkaraca.fintrackserver.dto.SavingsGoalDto;
import com.alpeerkaraca.fintrackserver.exception.UserNotFoundException;
import com.alpeerkaraca.fintrackserver.model.SavingsGoal;
import com.alpeerkaraca.fintrackserver.model.UserProfile;
import com.alpeerkaraca.fintrackserver.repository.SavingsGoalRepository;
import com.alpeerkaraca.fintrackserver.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavingsGoalService {
    private final SavingsGoalRepository savingsGoalRepository;
    private final UserProfileRepository userProfileRepository;

    public List<SavingsGoalDto> getGoals(UUID userId) {
        return savingsGoalRepository.findByUserProfileId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SavingsGoalDto createGoal(UUID userId, SavingsGoalCreateRequest request) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        SavingsGoal goal = SavingsGoal.builder()
                .id(savingsGoalRepository.generateUuidv7())
                .userProfile(user)
                .title(request.title())
                .targetAmount(request.targetAmount())
                .currentAmount(BigDecimal.ZERO)
                .currency(request.currency())
                .targetDate(request.targetDate())
                .build();

        return convertToDto(savingsGoalRepository.save(goal));
    }

    private SavingsGoalDto convertToDto(SavingsGoal goal) {
        BigDecimal progress = BigDecimal.ZERO;
        if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            progress = goal.getCurrentAmount()
                    .multiply(new BigDecimal("100"))
                    .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP);
        }

        return new SavingsGoalDto(
                goal.getId(),
                goal.getTitle(),
                goal.getTargetAmount(),
                goal.getCurrentAmount(),
                goal.getCurrency(),
                goal.getTargetDate(),
                progress.doubleValue()
        );
    }
}
