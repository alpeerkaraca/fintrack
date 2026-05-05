-- V2__uuidv7_defaults.sql
-- PostgreSQL 18+ : set UUID PK defaults to uuidv7()

-- user_profiles.id
alter table user_profiles
    alter column id set default uuidv7();

-- budget_months.id
alter table budget_months
    alter column id set default uuidv7();

-- budget_categories.id
alter table budget_categories
    alter column id set default uuidv7();

-- investment_assets.id
alter table investment_assets
    alter column id set default uuidv7();

-- transactions.id
alter table transactions
    alter column id set default uuidv7();
