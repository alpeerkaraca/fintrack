-- Flyway Migration V3: Remove dynamic calculation fields from investment_assets
-- These fields are now calculated at runtime via MarketDataService

ALTER TABLE investment_assets
    DROP COLUMN IF EXISTS current_price_try,
    DROP COLUMN IF EXISTS profit_loss_try,
    DROP COLUMN IF EXISTS change_percent;

CREATE INDEX IF NOT EXISTS idx_investment_assets_symbol ON investment_assets(symbol);