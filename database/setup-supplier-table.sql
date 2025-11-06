-- Supplier Management Table
-- Run this script to add supplier functionality

-- Create suppliers table
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    contact_person VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for suppliers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample suppliers
INSERT INTO suppliers (name, phone, email, contact_person, address, notes) VALUES
('ABC Food Distributors', '+60123456789', 'orders@abcfood.com', 'Ahmad Rahman', 'Jalan Sultan Ismail, Kuala Lumpur', 'Main rice and dry goods supplier'),
('Fresh Vegetables Supply Sdn Bhd', '+60187654321', 'sales@freshveg.com', 'Lim Wei Ming', 'Cameron Highlands, Pahang', 'Fresh vegetables and fruits supplier'),
('Dairy & Frozen Foods Co.', '+60192345678', 'contact@dairyfrozen.com', 'Siti Nurhaliza', 'Shah Alam, Selangor', 'Dairy products and frozen items');

-- Add indexes for better performance
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_phone ON suppliers(phone);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE suppliers IS 'Stores supplier information for procurement and inventory management';
COMMENT ON COLUMN suppliers.name IS 'Supplier company or individual name';
COMMENT ON COLUMN suppliers.phone IS 'Primary contact phone number';
COMMENT ON COLUMN suppliers.email IS 'Primary contact email address';
COMMENT ON COLUMN suppliers.contact_person IS 'Main point of contact person name';
COMMENT ON COLUMN suppliers.address IS 'Supplier physical address';
COMMENT ON COLUMN suppliers.notes IS 'Additional notes about the supplier';
COMMENT ON COLUMN suppliers.is_active IS 'Whether the supplier is currently active/available';