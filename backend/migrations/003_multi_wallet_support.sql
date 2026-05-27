-- Add multi-wallet support fields to wallets table
ALTER TABLE wallets 
ADD COLUMN label TEXT DEFAULT 'My Wallet',
ADD COLUMN is_primary BOOLEAN DEFAULT false,
ADD COLUMN linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on user_id for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Update existing wallets to have default label and set first wallet as primary
UPDATE wallets 
SET label = 'Wallet 1',
    is_primary = true,
    linked_at = created_at
WHERE is_primary IS NULL OR is_primary = false;
