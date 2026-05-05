---
name: git-workflow
description: >
  Expert in FinTrack's Git conventions: branch naming, conventional commits,
  and PR strategy. Use this skill when the user asks to write a commit message,
  name a branch, draft a PR description, or review whether a set of changes
  should be split into separate commits or branches.
---

# Git Workflow — FinTrack Conventions Expert

You enforce FinTrack's Git discipline: one feature per branch, atomic commits,
conventional commit format, and logical PR separation.

---

## Branch Naming

```
<type>/<kebab-case-description>
```

| Type | When to use |
|------|-------------|
| `feat/` | New feature or capability |
| `fix/` | Bug fix |
| `perf/` | Performance improvement |
| `optimization/` | Refactoring without behaviour change |
| `file/` | Documentation, config, or asset changes only |

### Examples

```bash
feat/investment-portfolio-runtime-calculations
fix/refresh-token-not-invalidated-on-revocation
perf/cache-dashboard-overview
optimization/remove-precomputed-asset-fields
file/update-gemini-context-files
```

---

## Commit Message Format

```
<type>: <Title in sentence case>

- Bullet point describing one specific change
- Another distinct change (implementation detail)
- Context or rationale if non-obvious
```

### Commit Types

| Type | Meaning |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `refactor` | Code restructure, no behaviour change |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build, dependency, or config changes |
| `security` | Security-related change |

### Examples

```
feat: Add runtime profit/loss calculation to investment portfolio

- Remove pre-calculated profit fields from InvestmentAsset entity
- Compute current price, cost basis, and gain% in InvestmentService at request time
- Cache market data via PriceService to avoid repeated scraping
- Add Flyway migration V8 to drop obsolete computed columns

fix: Prevent timing attack in AuthService login path

- Introduce DUMMY_HASH constant checked even when user is not found
- Replace direct Optional.get() with constant-time BCrypt.checkpw path
- Add unit test asserting dummy hash is always compared
```

---

## PR Strategy

### Separation of concerns

Split changes into **separate PRs** when they touch distinct concerns:

| Concerns that deserve separate PRs |
|------------------------------------|
| Security change + feature change |
| Performance refactor + new endpoint |
| Database migration + application code using it |
| Dependency upgrade + feature work |

### PR Description Template

```markdown
## Summary
One paragraph: what this PR does and why.

## Changes
- Service: ...
- Controller: ...
- Migration: ...
- Tests: ...

## Testing
- [ ] Unit tests pass: `./mvnw clean test`
- [ ] Manual smoke test performed
- [ ] No regressions in existing endpoints
```

---

## Pre-Commit Checklist

- [ ] Branch name follows `<type>/<kebab-case-description>`.
- [ ] Commit builds successfully (`./mvnw clean compile -DskipTests -q`).
- [ ] Commit message uses conventional format with bullet points.
- [ ] Single logical concern per commit (not "misc fixes").
- [ ] No secrets, `.env` files, or generated artifacts committed.
- [ ] Tests updated to cover the change.
