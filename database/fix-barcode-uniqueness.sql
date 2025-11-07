-- Fix barcode uniqueness issue for deleted products
-- This script allows reusing barcodes from deleted (is_active = false) products

-- Step 1: Drop the existing unique constraint on barcode
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_barcode_key;

-- Step 2: Create a partial unique index that only applies to active products
-- This allows inactive products to have duplicate barcodes
CREATE UNIQUE INDEX products_barcode_active_unique 
ON products (barcode) 
WHERE is_active = true;

-- Step 3: Add a comment explaining the constraint
COMMENT ON INDEX products_barcode_active_unique IS 'Ensures barcode uniqueness only for active products, allowing reuse of barcodes from deleted products';

-- Verification query (optional - uncomment to test)
-- SELECT barcode, is_active, count(*) 
-- FROM products 
-- WHERE barcode IN (
--   SELECT barcode FROM products GROUP BY barcode HAVING count(*) > 1
-- )
-- GROUP BY barcode, is_active 
-- ORDER BY barcode, is_active;