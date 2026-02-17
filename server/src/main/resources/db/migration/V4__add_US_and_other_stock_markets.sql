ALTER TABLE investment_assets
    RENAME COLUMN avg_cost_try TO total_cost_try;

ALTER TABLE investment_assets
    ADD COLUMN IF NOT EXISTS stock_market      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS avg_cost_original numeric(19, 4) DEFAULT 0     NOT NULL,
    ADD COLUMN IF NOT EXISTS purchase_currency varchar(3)     DEFAULT 'TRY' NOT NULL;


UPDATE investment_assets
SET stock_market = 'BIST'
WHERE stock_market IS NULL
  AND type IN ('STOCK', 'FUND');

ALTER TABLE investment_assets
    ADD CONSTRAINT check_stock_market_presence
        CHECK (
            (type IN ('STOCK', 'FUND') AND stock_market IS NOT NULL) OR
            (type NOT IN ('STOCK', 'FUND'))
            );