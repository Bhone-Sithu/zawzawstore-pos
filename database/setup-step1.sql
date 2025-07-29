-- Step 1: Create Custom Types
-- Run this first in Supabase SQL Editor

CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'boss');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE transfer_status AS ENUM ('pending', 'in_transit', 'completed', 'cancelled');