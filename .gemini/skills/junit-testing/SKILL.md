---
name: junit-testing
description: >
  Expert in FinTrack's JUnit 5 / Mockito / JaCoCo testing strategy. Use this
  skill when the user asks to write, fix, or improve a unit test, integration
  test, or data-layer test. Also activates for questions about test coverage,
  JaCoCo configuration, H2 in-memory database setup, AssertJ assertions, or
  running specific tests via the Maven wrapper.
---

# JUnit Testing — FinTrack Test Expert

You write and review tests for the FinTrack Spring Boot backend using JUnit 5,
Mockito, AssertJ, and H2 for persistence tests.

---

## Test Technology Stack

| Tool | Role |
|------|------|
| JUnit 5 | Test runner & lifecycle |
| Mockito | Mocking dependencies |
| AssertJ | Fluent assertions |
| H2 in-memory | DB layer tests (`@DataJpaTest`) |
| JaCoCo | Coverage reporting |

---

## Test Class Templates

### Service Unit Test

```java
@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private PriceService priceService;

    @InjectMocks
    private BudgetService budgetService;

    @Test
    void shouldReturnSafeStatus_whenLimitIsZero() {
        // Arrange
        UUID userId = UUID.randomUUID();
        // ...

        // Act
        BudgetLimitStatus status = budgetService.checkLimit(userId, BigDecimal.ZERO);

        // Assert
        assertThat(status).isEqualTo(BudgetLimitStatus.SAFE);
    }
}
```

### Repository / Data Layer Test

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY) // uses H2
class BudgetRepositoryTest {

    @Autowired
    private BudgetRepository budgetRepository;

    @Test
    void shouldFindBudgetsByUserAndYearMonth() {
        // arrange → act → assert
    }
}
```

### Auth Service Test Pattern (timing attack prevention)

```java
@Test
void shouldThrowInvalidCredentials_whenUserNotFound() {
    given(userRepository.findByUsername("ghost@example.com"))
        .willReturn(Optional.empty());

    assertThatThrownBy(() -> authService.login("ghost@example.com", "pw"))
        .isInstanceOf(InvalidCredentialsException.class);

    // Verify dummy hash was still checked (constant-time guarantee)
    verify(passwordEncoder).matches(anyString(), eq(DUMMY_HASH));
}
```

---

## AssertJ — Preferred Assertion Patterns

```java
// Collections
assertThat(result).hasSize(3).extracting(Budget::getId).containsExactlyInAnyOrder(...);

// Exceptions
assertThatThrownBy(() -> service.method())
    .isInstanceOf(AssetNotFoundException.class)
    .hasMessageContaining("symbol");

// BigDecimal
assertThat(profit).isEqualByComparingTo(new BigDecimal("120.50"));

// Optional
assertThat(optional).isPresent().get().extracting(User::getEmail).isEqualTo("a@b.com");
```

---

## Running Tests

```bash
# All tests
./mvnw clean test

# Single class
./mvnw test -Dtest=AuthServiceTest

# Single method
./mvnw test -Dtest=AuthServiceTest#testLoginSuccess

# Coverage report → target/site/jacoco/index.html
./mvnw test jacoco:report
```

---

## JaCoCo Exclusions

DTOs, models, configs, and JPA specifications are excluded from coverage
requirements (configured in `pom.xml`). Focus coverage on service and security
classes.

---

## Test Naming Convention

```
should{ExpectedBehaviour}_when{Condition}

✅  shouldReturnSafeStatus_whenLimitIsZero
✅  shouldThrowAssetNotFound_whenSymbolDoesNotExist
❌  testGetBudget   (too vague)
```

---

## Checklist Before Submitting Tests

- [ ] Uses `@ExtendWith(MockitoExtension.class)` for service tests.
- [ ] Uses `@DataJpaTest` + H2 for repository tests.
- [ ] Assertions use AssertJ (`assertThat`), not JUnit `assertEquals`.
- [ ] Test name follows `should…_when…` convention.
- [ ] No real network or DB calls in unit tests (all mocked).
- [ ] Happy path + at least one failure path covered.
- [ ] Financial calculations tested with `BigDecimal` equality via `isEqualByComparingTo`.
