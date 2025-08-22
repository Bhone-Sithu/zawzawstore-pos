-- Additional Sample Transaction Data for ZawZaw Store POS
-- This adds more transactions across different dates, branches, and categories

-- More transactions for the past 30 days
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
-- Week 1 (Aug 15-21) - More transactions
(
    gen_random_uuid(),
    'TXN-20250815-002',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Aung Kyaw',
    '+60123567890',
    35.75,
    2.15,
    0.00,
    37.90,
    'ewallet',
    'completed',
    '2025-08-15 10:30:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250815-003',
    '22222222-2222-2222-2222-222222222222', -- KL
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Thida Win',
    '+60187654321',
    52.25,
    3.14,
    8.00,
    47.39,
    'card',
    'completed',
    '2025-08-15 14:20:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250816-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Min Thu',
    '+60192345678',
    28.50,
    1.71,
    2.50,
    27.71,
    'cash',
    'completed',
    '2025-08-16 09:15:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250816-002',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Khin Lay',
    '+60123998877',
    41.00,
    2.46,
    5.00,
    38.46,
    'cash',
    'completed',
    '2025-08-16 16:45:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250817-001',
    '22222222-2222-2222-2222-222222222222', -- KL
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Zaw Htun',
    '+60198876543',
    19.75,
    1.19,
    0.00,
    20.94,
    'ewallet',
    'completed',
    '2025-08-17 11:30:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250817-002',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'Staff Items',
    NULL,
    15.50,
    0.00,
    0.00,
    15.50,
    'staff_account',
    'completed',
    '2025-08-17 13:20:00+00',
    true
),

-- Week 2 (Aug 8-14) - Historical data
(
    gen_random_uuid(),
    'TXN-20250808-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Mya Thandar',
    '+60123445566',
    67.50,
    4.05,
    12.00,
    59.55,
    'card',
    'completed',
    '2025-08-08 15:30:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250809-001',
    '22222222-2222-2222-2222-222222222222', -- KL
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Htun Win',
    '+60187776655',
    33.25,
    1.99,
    3.00,
    32.24,
    'ewallet',
    'completed',
    '2025-08-09 12:45:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250810-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Aye Mon',
    '+60192233445',
    78.90,
    4.73,
    15.00,
    68.63,
    'card',
    'completed',
    '2025-08-10 10:20:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250811-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Thu Zar',
    '+60123334455',
    24.75,
    1.49,
    1.00,
    25.24,
    'cash',
    'completed',
    '2025-08-11 14:15:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250812-001',
    '22222222-2222-2222-2222-222222222222', -- KL
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Kyaw Soe',
    '+60198887766',
    89.25,
    5.36,
    18.00,
    76.61,
    'card',
    'completed',
    '2025-08-12 16:30:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250813-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Nwe Ni',
    '+60193344556',
    45.50,
    2.73,
    7.00,
    41.23,
    'ewallet',
    'completed',
    '2025-08-13 09:45:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250814-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Hla Win',
    '+60123556677',
    36.00,
    2.16,
    4.00,
    34.16,
    'cash',
    'completed',
    '2025-08-14 13:20:00+00',
    false
),

-- Week 3 (Aug 1-7) - More historical data
(
    gen_random_uuid(),
    'TXN-20250801-001',
    '22222222-2222-2222-2222-222222222222', -- KL
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Phyu Sin',
    '+60187665544',
    123.75,
    7.43,
    25.00,
    106.18,
    'card',
    'completed',
    '2025-08-01 11:30:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250802-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Win Htut',
    '+60194455667',
    56.25,
    3.38,
    9.00,
    50.63,
    'ewallet',
    'completed',
    '2025-08-02 15:45:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250803-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Zin Mar',
    '+60123667788',
    32.50,
    1.95,
    3.50,
    30.95,
    'cash',
    'completed',
    '2025-08-03 10:15:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250804-001',
    '22222222-2222-2222-2222-222222222222', -- KL
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Yan Naing',
    '+60188990011',
    71.00,
    4.26,
    12.00,
    63.26,
    'card',
    'completed',
    '2025-08-04 14:30:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250805-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Thant Zin',
    '+60195566778',
    48.75,
    2.93,
    6.00,
    45.68,
    'ewallet',
    'completed',
    '2025-08-05 12:45:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250806-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'Staff Purchase',
    NULL,
    22.50,
    0.00,
    0.00,
    22.50,
    'staff_account',
    'completed',
    '2025-08-06 16:20:00+00',
    true
),
(
    gen_random_uuid(),
    'TXN-20250807-001',
    '22222222-2222-2222-2222-222222222222', -- KL
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Ei Thuzar',
    '+60189900112',
    94.50,
    5.67,
    20.00,
    80.17,
    'card',
    'completed',
    '2025-08-07 09:30:00+00',
    false
),

-- Last month (July) transactions
(
    gen_random_uuid(),
    'TXN-20250728-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Soe Min',
    '+60123778899',
    156.75,
    9.41,
    30.00,
    136.16,
    'card',
    'completed',
    '2025-07-28 13:45:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250729-001',
    '33333333-3333-3333-3333-333333333333', -- Sungai Buloh
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Kyi Kyi',
    '+60196677889',
    87.25,
    5.24,
    15.00,
    77.49,
    'ewallet',
    'completed',
    '2025-07-29 11:20:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250726-001',
    '22222222-2222-2222-2222-222222222222', -- KL
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Thura Aung',
    '+60188811223',
    203.50,
    12.21,
    40.00,
    175.71,
    'card',
    'completed',
    '2025-07-26 15:30:00+00',
    false
),
(
    gen_random_uuid(),
    'TXN-20250727-001',
    '11111111-1111-1111-1111-111111111111', -- Rawang
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    'Nan Thiri',
    '+60123889900',
    73.25,
    4.40,
    12.00,
    65.65,
    'cash',
    'completed',
    '2025-07-27 10:15:00+00',
    false
);

-- Transaction items for the additional transactions
INSERT INTO transaction_items (
    id,
    transaction_id,
    product_id,
    quantity,
    unit_price,
    total_price
) VALUES 
-- Items for TXN-20250815-002 (Rawang - Mixed categories)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250815-002'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe (Coffee & Tea)
    2,
    14.00,
    28.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250815-002'),
    '17f6dfe6-7429-432e-8168-75c6284d83c8', -- Cypro Tone (Medicine)
    1,
    7.75, -- Discounted price
    7.75
),

-- Items for TXN-20250815-003 (KL - Large order)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250815-003'),
    '1cf3fb51-35e7-4ac7-a6b8-b53959319d86', -- Sunday Tea Mix
    2,
    19.00,
    38.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250815-003'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe
    1,
    14.25,
    14.25
),

-- Items for TXN-20250816-001 (Sungai Buloh - Food items)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250816-001'),
    '05e6ae8c-dcd0-4fbf-bf2c-e1eab4705bdc', -- Taw Win Palm
    3,
    6.00,
    18.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250816-001'),
    '100d900a-00d3-41dc-924d-f4ad56158346', -- Golden Butterfly
    2,
    3.00,
    6.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250816-001'),
    '2466916b-4046-493b-8733-31bad930d513', -- Top Choice
    1,
    4.50,
    4.50
),

-- Items for TXN-20250816-002 (Rawang - Beverages focus)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250816-002'),
    '0e844c3d-d4eb-4c1f-a38f-6873d521b67a', -- Lippo
    5,
    3.00,
    15.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250816-002'),
    '009e6d34-9695-45e9-ae21-ae10f9605df9', -- Dee Do PINEAPPLE
    8,
    1.00,
    8.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250816-002'),
    '3188fe69-1255-4d2f-bfeb-560f05aad62e', -- Veve Tamarind
    9,
    2.00,
    18.00
),

-- Items for TXN-20250817-001 (KL - Snacks)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250817-001'),
    '05e2ea6b-a790-4511-afdd-df48bf8c55e6', -- Shan Beans
    4,
    2.00,
    8.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250817-001'),
    '100d900a-00d3-41dc-924d-f4ad56158346', -- Golden Butterfly
    3,
    3.00,
    9.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250817-001'),
    '0967daed-b28d-4019-a044-bca0df742a66', -- Shal Pyone
    1,
    2.75, -- Discounted
    2.75
),

-- Items for TXN-20250817-002 (Staff checkout)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250817-002'),
    '009e6d34-9695-45e9-ae21-ae10f9605df9', -- Dee Do PINEAPPLE
    6,
    1.00,
    6.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250817-002'),
    '05e2ea6b-a790-4511-afdd-df48bf8c55e6', -- Shan Beans
    3,
    2.00,
    6.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250817-002'),
    '100d900a-00d3-41dc-924d-f4ad56158346', -- Golden Butterfly
    1,
    3.50,
    3.50
),

-- Items for TXN-20250808-001 (Large order - Tea focus)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250808-001'),
    '1cf3fb51-35e7-4ac7-a6b8-b53959319d86', -- Sunday Tea Mix
    3,
    19.00,
    57.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250808-001'),
    '129687df-53d4-4d58-8a27-9448a843dfdc', -- Soe Win Green Tea Box
    1,
    7.00,
    7.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250808-001'),
    '10929271-7802-4f35-bd5e-66f20ecf79f4', -- Soe Win Tea Leaves
    1,
    3.50, -- Discounted bulk
    3.50
),

-- Items for TXN-20250809-001 (Mixed items)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250809-001'),
    '0e844c3d-d4eb-4c1f-a38f-6873d521b67a', -- Lippo
    4,
    3.00,
    12.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250809-001'),
    '05e6ae8c-dcd0-4fbf-bf2c-e1eab4705bdc', -- Taw Win Palm
    2,
    6.00,
    12.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250809-001'),
    '05e2ea6b-a790-4511-afdd-df48bf8c55e6', -- Shan Beans
    4,
    2.00,
    8.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250809-001'),
    '00312a28-f22c-44b8-9d15-89cbd39cf135', -- Basil Seed MIX FRUIT
    1,
    1.25,
    1.25
),

-- Items for TXN-20250810-001 (Large variety order)
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250810-001'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe
    4,
    14.00,
    56.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250810-001'),
    '17f6dfe6-7429-432e-8168-75c6284d83c8', -- Cypro Tone
    1,
    22.90,
    22.90
),

-- Continue with more items for other transactions...
-- Items for last month's large orders
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250728-001'),
    '1cf3fb51-35e7-4ac7-a6b8-b53959319d86', -- Sunday Tea Mix
    6,
    19.00,
    114.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250728-001'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe
    3,
    14.25,
    42.75
),

(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250726-001'),
    '31ab99f4-1656-46a9-850a-373b6db0446b', -- NesCafe
    8,
    14.00,
    112.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250726-001'),
    '1cf3fb51-35e7-4ac7-a6b8-b53959319d86', -- Sunday Tea Mix
    4,
    18.50, -- Bulk discount
    74.00
),
(
    gen_random_uuid(),
    (SELECT id FROM transactions WHERE transaction_number = 'TXN-20250726-001'),
    '17f6dfe6-7429-432e-8168-75c6284d83c8', -- Cypro Tone
    1,
    17.50,
    17.50
);

-- Additional staff items for variety
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
    '0e844c3d-d4eb-4c1f-a38f-6873d521b67a', -- Lippo
    8,
    8,
    2025,
    'Staff refreshments - drinks'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    '05e2ea6b-a790-4511-afdd-df48bf8c55e6', -- Shan Beans
    12,
    8,
    2025,
    'Office snacks for meetings'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE role = 'cashier' LIMIT 1),
    '129687df-53d4-4d58-8a27-9448a843dfdc', -- Soe Win Green Tea Box
    2,
    7,
    2025,
    'July staff tea'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    '17f6dfe6-7429-432e-8168-75c6284d83c8', -- Cypro Tone
    1,
    8,
    2025,
    'First aid supplies'
);