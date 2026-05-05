---
name: flyway-migration
description: >
  Expert in FinTrack's Flyway database migration workflow for PostgreSQL 18.
  Use this skill when the user needs to create a new SQL migration, modify the
  schema (add table, column, index, constraint), understand the migration history,
  or troubleshoot Flyway validation errors. Also activates for questions about
  existing database indexes, composite keys, or UUID v7 usage.
---

# Flyway Migration — FinTrack Database Expert

You manage all database schema changes for FinTrack through versioned Flyway
migrations. The database is PostgreSQL 18. DDL auto is set to `validate` —
Hibernate will **never** modify the schema; all DDL must go through Flyway.

---

## Migration Location

```
server/src/main/resources/db/migration/
```

---

## Naming Convention

```
V{number}__{description}.sql
```

- Version number is an **integer** — check the highest existing version and
  increment by 1.
- Double underscore (`__`) separates version from description.
- Description uses underscores, no spaces.
- Examples: `V6__add_portfolio_snapshot_table.sql`
            `V7__add_index_on_investment_created_at.sql`

**Never rename or modify an existing migration that has been applied in any
environment** — Flyway will detect the checksum change and refuse to start.

---

## Workflow for Every New Migration

1. Find the latest version number in `db/migration/`.
2. Create `V{next}__{description}.sql`.
3. Write idempotent SQL where possible (use `IF NOT EXISTS`, etc.).
4. Add the appropriate indexes (see below).
5. Restart the backend — Flyway applies automatically.
6. Verify in logs: `Successfully applied 1 migration`.

---

## Index Policy

Always add indexes for columns used in WHERE clauses or JOINs:

```sql
-- Existing critical indexes (do not re-create)
CREATE INDEX IF NOT EXISTS budget_month_user_year_month   ON budget_month(user_id, year, month);
CREATE INDEX IF NOT EXISTS budget_category_user_month     ON budget_category(user_id, month_id);
CREATE INDEX IF NOT EXISTS transaction_user_date          ON transaction(user_id, date);
CREATE INDEX IF NOT EXISTS investment_assets_symbol       ON investment_assets(symbol);
```

For every new table, evaluate which columns need an index and include it in the
same migration file.

---

## UUID Strategy

FinTrack uses **UUID v7** for all primary keys (chronologically sortable).
Use PostgreSQL's `gen_random_uuid()` as a fallback only if v7 is not available
via the application layer.

---

## Common Flyway Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Validate failed: detected resolved migration not applied` | New migration file doesn't match DB state | Check version numbering |
| `Migration checksum mismatch` | Existing migration was modified | Revert the file; never edit applied migrations |
| `Found more than one migration with version X` | Duplicate version number | Rename one file to the next available version |

---

## SQL Style Guide

```sql
-- ✅ Preferred style
CREATE TABLE IF NOT EXISTS fund_snapshot (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol       VARCHAR(20)  NOT NULL,
    price        NUMERIC(18, 6) NOT NULL,
    recorded_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fund_snapshot_user_recorded
    ON fund_snapshot(user_id, recorded_at DESC);
```

See `references/naming-convention.md` in this skill directory for full table
and column naming rules.
