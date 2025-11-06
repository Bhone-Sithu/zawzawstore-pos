-- Add supplier_id to transactions table
-- Run this script to add supplier tracking to transactions

-- Add supplier_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN supplier_id UUID REFERENCES suppliers(id);

-- Add index for better performance
CREATE INDEX idx_transactions_supplier_id ON transactions(supplier_id);

-- Add comment for documentation
COMMENT ON COLUMN transactions.supplier_id IS 'Reference to supplier when transaction is a supplier checkout';

-- Optional: Add constraint to ensure supplier_id is only set when supplier_checkout is true
-- ALTER TABLE transactions 
-- ADD CONSTRAINT chk_supplier_checkout_consistency 
-- CHECK (
--   (supplier_checkout = true AND supplier_id IS NOT NULL) OR 
--   (supplier_checkout = false AND supplier_id IS NULL)
-- );

-- Note: The constraint above is commented out to allow flexibility during development
-- You can uncomment it later if you want to enforce strict consistency