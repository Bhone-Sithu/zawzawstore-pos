-- Sample Transaction Data for ZawZaw Store POS
-- Execute this after setting up the main schema and having users/products in place

-- Sample transactions for different branches and time periods
INSERT INTO transactions (
    id, 
    transaction_number, 
    branch_id, 
    cashier_id, 
    customer_name, 
    customer_phone, 
    subtotal, 
    tax_amount, 
    discount_amount, 
    total_amount, 
    payment_method, 
    status, 
    created_at,
    staff_checkout
) VALUES 
-- Transaction 1: Regular customer sale at Rawang branch
(
    gen_random_uuid(),
    'TXN-20250822-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Maung Maung',
    '+60123456789',
    15.50,
    0.93, -- 6% tax
    0.00,
    16.43,
    'cash',
    'completed',
    '2025-08-22 09:30:00+00',
    false
),
-- Transaction 2: Staff checkout at KL branch
(
    gen_random_uuid(),
    'TXN-20250822-002',
    '22222222-2222-2222-2222-222222222222', -- KL branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Staff Purchase',
    NULL,
    8.00,
    0.00, -- No tax for staff
    2.00, -- Staff discount
    6.00,
    'staff_account',
    'completed',
    '2025-08-22 10:15:00+00',
    true
),
-- Transaction 3: Large sale at Sungai Buloh
(
    gen_random_uuid(),
    'TXN-20250822-003',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Daw Su Su',
    '+60198765432',
    45.75,
    2.75, -- 6% tax
    5.00, -- Customer discount
    43.50,
    'card',
    'completed',
    '2025-08-22 11:45:00+00',
    false
),
-- Transaction 4: Small beverage sale at Rawang
(
    gen_random_uuid(),
    'TXN-20250822-004',
    '11111111-1111-1111-1111-111111111111', -- Rawang branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Ko Thant',
    '+60123334444',
    3.00,
    0.18, -- 6% tax
    0.00,
    3.18,
    'cash',
    'completed',
    '2025-08-22 12:20:00+00',
    false
),
-- Transaction 5: Mixed items at KL branch
(
    gen_random_uuid(),
    'TXN-20250822-005',
    '22222222-2222-2222-2222-222222222222', -- KL branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Ma Thida',
    '+60187776666',
    22.50,
    1.35, -- 6% tax
    1.00, -- Small discount
    22.85,
    'ewallet',
    'completed',
    '2025-08-22 13:10:00+00',
    false
),
-- Transaction 6: Yesterday's sale
(
    gen_random_uuid(),
    'TXN-20250821-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'U Kyaw',
    '+60123445566',
    12.75,
    0.77, -- 6% tax
    0.00,
    13.52,
    'cash',
    'completed',
    '2025-08-21 14:30:00+00',
    false
),
-- Transaction 7: Last week's large order
(
    gen_random_uuid(),
    'TXN-20250815-001',
    '22222222-2222-2222-2222-222222222222', -- KL branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Daw Mya',
    '+60199887755',
    67.25,
    4.04, -- 6% tax
    10.00, -- Bulk discount
    61.29,
    'card',
    'completed',
    '2025-08-15 16:45:00+00',
    false
),
-- Transaction 8: Staff monthly checkout
(
    gen_random_uuid(),
    'TXN-20250820-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh branch
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'Monthly Staff Items',
    NULL,
    25.00,
    0.00, -- No tax for staff
    0.00,
    25.00,
    'staff_account',
    'completed',
    '2025-08-20 17:00:00+00',
    true
),
-- Transaction 9: Medicine sale
(
    gen_random_uuid(),
    'TXN-20250822-006',
    '11111111-1111-1111-1111-111111111111', -- Rawang branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'U Than Htut',
    '+60123555777',
    32.50,
    1.95, -- 6% tax
    0.00,
    34.45,
    'cash',
    'completed',
    '2025-08-22 15:20:00+00',
    false
),
-- Transaction 10: Beauty products sale
(
    gen_random_uuid(),
    'TXN-20250822-007',
    '22222222-2222-2222-2222-222222222222', -- KL branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Ma Hnin',
    '+60189998888',
    18.75,
    1.13, -- 6% tax
    2.50, -- Beauty discount
    17.38,
    'card',
    'completed',
    '2025-08-22 16:45:00+00',
    false
),
-- Additional transactions for this week
(
    gen_random_uuid(),
    'TXN-20250819-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Ko Min',
    '+60187654321',
    28.90,
    1.73, -- 6% tax
    3.00,
    27.63,
    'ewallet',
    'completed',
    '2025-08-19 11:30:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250818-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Daw Khin',
    '+60123777999',
    41.25,
    2.48, -- 6% tax
    5.00, -- Regular customer discount
    38.73,
    'cash',
    'completed',
    '2025-08-18 13:15:00+00',
    false
),
-- Last month's transactions for monthly reporting
(
    gen_random_uuid(),
    'TXN-20250725-001',
    '22222222-2222-2222-2222-222222222222', -- KL branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'U Zaw',
    '+60198887777',
    89.50,
    5.37, -- 6% tax
    15.00, -- Large order discount
    79.87,
    'card',
    'completed',
    '2025-07-25 14:20:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250730-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh branch
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Ma Su',
    '+60187776655',
    156.75,
    9.41, -- 6% tax
    25.00, -- Bulk discount
    141.16,
    'card',
    'completed',
    '2025-07-30 10:45:00+00',
    false
);

-- Sample transaction items for the above transactions
INSERT INTO transaction_items (
    id,
    transaction_id,
    product_id,
    quantity,
    unit_price,
    total_price
) VALUES 
-- Items for Transaction 1 (TXN-20250822-001) - Food & Drinks
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-001'),
    '00312a28-f22c-44b8-9d15-89cbd39cf135', -- Basil Seed MIX FRUIT (Drinks)
    2,
    1.00,
    2.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-001'),
    '05e2ea6b-a790-4511-afdd-df48bf8c55e6', -- Shan Beans (Food)
    3,
    2.00,
    6.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-001'),
    '0967daed-b28d-4019-a044-bca0df742a66', -- Shal Pyone (Food)
    1,
    5.00,
    5.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-001'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe (Coffee & Tea mix)
    1,
    2.50, -- Custom price
    2.50
),

-- Items for Transaction 2 (Staff checkout)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-002'),
    '009e6d34-9695-45e9-ae21-ae10f9605df9', -- Dee Do PINEAPPLE (Drinks)
    3,
    1.00,
    3.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-002'),
    '0e844c3d-d4eb-4c1f-a38f-6873d521b67a', -- Lippo (Drinks)
    1,
    3.00,
    3.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-002'),
    '05e2ea6b-a790-4511-afdd-df48bf8c55e6', -- Shan Beans (Food)
    1,
    2.00,
    2.00
),

-- Items for Transaction 3 (Large sale) - Coffee & Tea
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-003'),
    '10929271-7802-4f35-bd5e-66f20ecf79f4', -- Soe Win Tea Leaves (Coffee & Tea mix)
    2,
    16.00,
    32.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-003'),
    '1cf3fb51-35e7-4ac7-a6b8-b53959319d86', -- Sunday Tea Mix (Coffee & Tea mix)
    1,
    13.75, -- Discounted price
    13.75
),

-- Items for Transaction 4 (Small beverage sale)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-004'),
    '0e844c3d-d4eb-4c1f-a38f-6873d521b67a', -- Lippo (Drinks)
    1,
    3.00,
    3.00
),

-- Items for Transaction 5 (Mixed items)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-005'),
    '100d900a-00d3-41dc-924d-f4ad56158346', -- Golden Butterfly (Food)
    2,
    3.00,
    6.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-005'),
    '05e6ae8c-dcd0-4fbf-bf2c-e1eab4705bdc', -- Taw Win Palm (Food)
    2,
    6.00,
    12.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-005'),
    '2466916b-4046-493b-8733-31bad930d513', -- Top Choice (Food)
    1,
    4.50, -- Custom price
    4.50
),

-- Items for Transaction 6 (Yesterday's sale)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250821-001'),
    '129687df-53d4-4d58-8a27-9448a843dfdc', -- Soe Win Green Tea Box (Coffee & Tea mix)
    1,
    7.00,
    7.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250821-001'),
    '1cf0d217-435f-413e-b32a-e44141acf789', -- Sailing Boat (Food)
    1,
    5.75, -- Slightly higher price
    5.75
),

-- Items for Transaction 7 (Last week's large order)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250815-001'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe (Coffee & Tea mix)
    3,
    14.00,
    42.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250815-001'),
    '1cf3fb51-35e7-4ac7-a6b8-b53959319d86', -- Sunday Tea Mix (Coffee & Tea mix)
    1,
    19.00,
    19.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250815-001'),
    '05e6ae8c-dcd0-4fbf-bf2c-e1eab4705bdc', -- Taw Win Palm (Food)
    1,
    6.25, -- Slightly higher price
    6.25
),

-- Items for Transaction 8 (Staff monthly checkout)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250820-001'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe (Coffee & Tea mix)
    1,
    14.00,
    14.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250820-001'),
    '100d900a-00d3-41dc-924d-f4ad56158346', -- Golden Butterfly (Food)
    2,
    3.00,
    6.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250820-001'),
    '0967daed-b28d-4019-a044-bca0df742a66', -- Shal Pyone (Food)
    1,
    5.00,
    5.00
),

-- Items for Transaction 9 (Medicine sale)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-006'),
    '17f6dfe6-7429-432e-8168-75c6284d83c8', -- Cypro Tone (English Medicine)
    1,
    25.00,
    25.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-006'),
    '129687df-53d4-4d58-8a27-9448a843dfdc', -- Soe Win Green Tea Box (Coffee & Tea mix)
    1,
    7.50, -- Slightly higher price
    7.50
),

-- Items for Transaction 10 (Beauty products) - would need actual beauty product IDs
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-007'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe (Coffee & Tea mix)
    1,
    14.00,
    14.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250822-007'),
    '1cf0d217-435f-413e-b32a-e44141acf789', -- Sailing Boat (Food)
    1,
    4.75, -- Custom price
    4.75
),

-- Items for additional transactions
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250819-001'),
    '10929271-7802-4f35-bd5e-66f20ecf79f4', -- Soe Win Tea Leaves (Coffee & Tea mix)
    1,
    16.00,
    16.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250819-001'),
    '100d900a-00d3-41dc-924d-f4ad56158346', -- Golden Butterfly (Food)
    3,
    3.00,
    9.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250819-001'),
    '009e6d34-9695-45e9-ae21-ae10f9605df9', -- Dee Do PINEAPPLE (Drinks)
    4,
    0.90, -- Bulk price
    3.60
),

(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250818-001'),
    '1cf3fb51-35e7-4ac7-a6b8-b53959319d86', -- Sunday Tea Mix (Coffee & Tea mix)
    2,
    19.00,
    38.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250818-001'),
    '05e6ae8c-dcd0-4fbf-bf2c-e1eab4705bdc', -- Taw Win Palm (Food)
    1,
    6.00,
    6.00
),

-- Last month transactions
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250725-001'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe (Coffee & Tea mix)
    5,
    14.00,
    70.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250725-001'),
    '10929271-7802-4f35-bd5e-66f20ecf79f4', -- Soe Win Tea Leaves (Coffee & Tea mix)
    1,
    16.00,
    16.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250725-001'),
    '17f6dfe6-7429-432e-8168-75c6284d83c8', -- Cypro Tone (English Medicine)
    1,
    25.00,
    25.00
),

(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250730-001'),
    '1cf3fb51-35e7-4ac7-a6b8-b53959319d86', -- Sunday Tea Mix (Coffee & Tea mix)
    6,
    19.00,
    114.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250730-001'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe (Coffee & Tea mix)
    3,
    14.00,
    42.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250730-001'),
    '17f6dfe6-7429-432e-8168-75c6284d83c8', -- Cypro Tone (English Medicine)
    2,
    25.00,
    50.00
);

-- Sample staff items tracking
INSERT INTO staff_items (
    id,
    staff_id,
    product_id,
    quantity,
    month,
    year,
    notes
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe
    2,
    8, -- August
    2025,
    'Monthly coffee allowance'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    '009e6d34-9695-45e9-ae21-ae10f9605df9', -- Dee Do PINEAPPLE
    5,
    8, -- August
    2025,
    'Staff refreshments'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    '05e2ea6b-a790-4511-afdd-df48bf8c55e6', -- Shan Beans
    3,
    8, -- August
    2025,
    'Lunch items'
);