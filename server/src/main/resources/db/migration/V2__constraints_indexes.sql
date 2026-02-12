-- Flyway migration V2: constraints & performance indexes for FinTrack (PostgreSQL)
-- Adds integrity checks and indexes that improve query performance.

-- =========================
-- budget_months
-- =========================
-- Ensure month is valid (1..12)
alter table budget_months
    add constraint ck_budget_month_range
        check (month between 1 and 12);

-- Totals should never be negative
alter table budget_months
    add constraint ck_budget_month_totals_nonneg
        check (income_try >= 0 and expense_try >= 0 and net_savings_try >= 0);

-- One row per user per year-month
alter table budget_months
    add constraint uq_budget_month_user_year_month
        unique (user_profile_id, year, month);

-- Helpful for monthly budget queries
create index if not exists idx_budget_month_user_year_month
    on budget_months (user_profile_id, year, month);

create index if not exists idx_budget_month_user_year
    on budget_months (user_profile_id, year);

-- =========================
-- budget_categories
-- =========================
-- Prevent duplicate budgets per user + month + category
alter table budget_categories
    add constraint uq_budget_user_month_category
        unique (user_profile_id, budget_month_id, category);

-- Helpful for monthly budget queries
create index if not exists idx_budget_category_user_month
    on budget_categories (user_profile_id, budget_month_id);

-- =========================
-- transactions
-- =========================
-- Query patterns: user timeline + date range
create index if not exists idx_tx_user_date
    on transactions (user_profile_id, date desc);

-- Query patterns: per-category analytics
create index if not exists idx_tx_user_category_date
    on transactions (user_profile_id, category, date desc);

-- Query patterns: installment-only screens/reports
create index if not exists idx_tx_user_installment_true
    on transactions (user_profile_id)
    where is_installment = true;

-- Integrity: amount must be positive
alter table transactions
    add constraint ck_tx_amount_positive
        check (amount_try > 0);

-- Integrity: installment meta must be consistent
alter table transactions
    add constraint ck_tx_installment_meta
        check (
            (is_installment = false and months is null and total_try is null and start_month is null)
                or
            (is_installment = true  and months is not null and months >= 2 and total_try is not null and start_month is not null)
            );

-- Optional: ensure start_month is YYYY-MM when provided
alter table transactions
    add constraint ck_tx_start_month_format
        check (start_month is null or start_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

-- =========================
-- refresh_tokens
-- =========================
-- Index for active (not revoked) tokens by hash, which is common during token validation
create index if not exists idx_refresh_token_hash_not_revoked
    on refresh_tokens (token_hash)
    where revoked = false;

-- Optional if you frequently clean up expired tokens:
create index if not exists idx_refresh_expires_at
    on refresh_tokens (expires_at);
