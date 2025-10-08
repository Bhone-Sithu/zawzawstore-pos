-- Grocery Store POS Database Schema

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'boss');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'in_transit', 'completed', 'cancelled');
CREATE TYPE stock_adjustment_reason AS ENUM ('received', 'damaged', 'expired', 'theft', 'sold', 'transfer_out', 'transfer_in', 'adjustment', 'return');

-- Branches table
CREATE TABLE branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users/Staff table (integrates with Clerk)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    branch_id UUID REFERENCES branches(id),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product categories
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_mm VARCHAR(100) NOT NULL,
    custom_price BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    custom_price BOOLEAN DEFAULT false,
);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_mm VARCHAR(200) NOT NULL,
    image TEXT,
    category_id UUID REFERENCES categories(id),
    supplier_price DECIMAL(10,2),
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table (branch-specific stock)
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2),
    expiry_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, branch_id)
);

-- Stock transfers between branches
CREATE TABLE stock_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_branch_id UUID REFERENCES branches(id),
    to_branch_id UUID REFERENCES branches(id),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status transfer_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock transfer items
CREATE TABLE stock_transfer_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions/Sales
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    branch_id UUID REFERENCES branches(id),
    cashier_id UUID REFERENCES users(id),
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status transaction_status DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    staff_checkout BOOLEAN DEFAULT false,
);

-- Transaction items
CREATE TABLE transaction_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff item tracking (items taken by staff)
CREATE TABLE staff_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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