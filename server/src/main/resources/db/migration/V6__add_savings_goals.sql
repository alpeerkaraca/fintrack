-- V6__add_savings_goals.sql
-- Adds table for tracking long-term savings goals

create table if not exists savings_goals
(
    id               uuid primary key default uuidv7(),
    user_profile_id  uuid           not null,
    title            varchar(255)   not null,
    target_amount    numeric(19, 2) not null,
    current_amount   numeric(19, 2) not null default 0,
    currency         varchar(10)    not null default 'TRY',
    target_date      date,
    created_at       timestamp      not null default now(),
    updated_at       timestamp      not null default now(),
    
    constraint fk_savings_user foreign key (user_profile_id) references user_profiles (id) on delete cascade
);

create index if not exists idx_savings_user on savings_goals (user_profile_id);
