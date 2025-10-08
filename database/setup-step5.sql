-- Step 5: Create Indexes and Insert Sample Data
-- Run this after Step 4

-- Create indexes for better performance
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_inventory_branch ON inventory(branch_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_transactions_branch ON transactions(branch_id);
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_branch ON users(branch_id);

-- Insert default branches
INSERT INTO branches (id, name, location, address) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Grocery Store Rawang', 'Rawang, Malaysia', 'Rawang, Selangor, Malaysia'),
    ('22222222-2222-2222-2222-222222222222', 'Grocery Store KL', 'Kuala Lumpur, Malaysia', 'Kuala Lumpur, Malaysia'),
    ('33333333-3333-3333-3333-333333333333', 'Grocery Store Sungai Buloh', 'Sungai Buloh, Malaysia', 'Sungai Buloh, Selangor, Malaysia');

-- Insert default categories
INSERT INTO categories (name_en, name_mm) VALUES
    ('Electronics', 'လျှပ်စစ်ပစ္စည်းများ'),
    ('Food & Beverages', 'အစားအသောက်'),
    ('Clothing', 'အဝတ်အထည်'),
    ('Home & Garden', 'အိမ်နှင့်ဥယျာဉ်'),
    ('Health & Beauty', 'ကျန်းမာရေးနှင့်အလှကုန်');