-- Script to add users to the system
-- Replace the values with actual user data from Clerk

-- Step 1: Get Clerk user ID from your Clerk dashboard
-- Step 2: Replace the values below and run in Supabase SQL Editor

-- Example: Add Admin User
INSERT INTO users (
    clerk_id, 
    email, 
    name, 
    role, 
    branch_id, 
    is_active
) VALUES (
    'user_clerk_id_here',  -- Replace with actual Clerk user ID
    'admin@zawzaw.com',    -- Replace with actual email
     'Admin User',          -- Replace with actual name
    'admin',               -- Role: 'admin', 'cashier', or 'boss'
    '11111111-1111-1111-1111-111111111111',  -- Rawang branch ID
    true
);

-- Example: Add Cashier User
INSERT INTO users (
    clerk_id, 
    email, 
    name, 
    role, 
    branch_id, 
    is_active
) VALUES (
    'user_clerk_id_here_2',  -- Replace with actual Clerk user ID
    'cashier@zawzaw.com',    -- Replace with actual email
    'Cashier User',          -- Replace with actual name
    'cashier',               -- Role: 'admin', 'cashier', or 'boss'
    '22222222-2222-2222-2222-222222222222',  -- KL branch ID
    true
);

-- Example: Add Boss User
INSERT INTO users (
    clerk_id, 
    email, 
    name, 
    role, 
    branch_id, 
    is_active
) VALUES (
    'user_clerk_id_here_3',  -- Replace with actual Clerk user ID
    'boss@zawzaw.com',       -- Replace with actual email
    'Boss User',             -- Replace with actual name
    'boss',                  -- Role: 'admin', 'cashier', or 'boss'
    NULL,                    -- Boss can access all branches
    true
);

-- Available Branch IDs:
-- Rawang: '11111111-1111-1111-1111-111111111111'
-- KL: '22222222-2222-2222-2222-222222222222'  
-- Sungai Buloh: '33333333-3333-3333-3333-333333333333'