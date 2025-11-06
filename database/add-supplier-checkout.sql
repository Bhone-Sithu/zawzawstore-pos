-- Add supplier_checkout field to transactions table
-- This migration adds support for supplier checkout mode alongside staff checkout

BEGIN;

-- Add supplier_checkout column to transactions table
ALTER TABLE transactions 
ADD COLUMN supplier_checkout BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN transactions.supplier_checkout IS 'Indicates if this transaction is a supplier purchase (store buying from supplier)';

-- Update any existing transactions to have explicit false values for supplier_checkout
UPDATE transactions 
SET supplier_checkout = false 
WHERE supplier_checkout IS NULL;

COMMIT;

-- Note: This migration is safe to run multiple times
-- If the column already exists, the ALTER TABLE will fail gracefully