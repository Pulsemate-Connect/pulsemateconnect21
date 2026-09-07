-- Fix using the actual ID from the database
-- Run this AFTER checking FIND_ALL_KOTHARKAR.sql to confirm the ID

-- Fix kotharkar276@gmail.com (ID: e3810897-a7a6-4574-a77f-ec57237258a1)
UPDATE users
SET 
  mobile = '+919999999999',
  "isPhoneVerified" = true,
  "updatedAt" = NOW()
WHERE id = 'e3810897-a7a6-4574-a77f-ec57237258a1';

-- Verify it worked
SELECT 
  id,
  name,
  email,
  mobile,
  "isPhoneVerified",
  "approvalStatus"
FROM users
WHERE id = 'e3810897-a7a6-4574-a77f-ec57237258a1';
