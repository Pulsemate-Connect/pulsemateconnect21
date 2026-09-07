-- Fix the stuck appointment that has payment PAID but status PENDING_PAYMENT
-- Appointment ID: 21490b1f-e873-4414-b896-694836459e1c

-- Step 1: Check current state
SELECT 
  a.id,
  a.status as appointment_status,
  a."queueNumber",
  a."appointmentDate",
  a."slotTime",
  p.status as payment_status,
  p.amount
FROM appointments a
LEFT JOIN payments p ON p."appointmentId" = a.id
WHERE a.id = '21490b1f-e873-4414-b896-694836459e1c';

-- Step 2: Update appointment to BOOKED status
UPDATE appointments
SET 
  status = 'BOOKED',
  "queueNumber" = 1,  -- Assign queue number 1 (first in queue for that day)
  "estimatedWaitMinutes" = 0
WHERE id = '21490b1f-e873-4414-b896-694836459e1c';

-- Step 3: Get queue ID for this appointment's date/doctor/clinic
-- (You'll need to get the queueId from this query result)
SELECT 
  id as queue_id,
  date,
  "clinicId",
  "doctorId"
FROM queues
WHERE 
  "clinicId" = (SELECT "clinicId" FROM appointments WHERE id = '21490b1f-e873-4414-b896-694836459e1c')
  AND "doctorId" = (SELECT "doctorId" FROM appointments WHERE id = '21490b1f-e873-4414-b896-694836459e1c')
  AND date = (SELECT DATE("appointmentDate") FROM appointments WHERE id = '21490b1f-e873-4414-b896-694836459e1c')
LIMIT 1;

-- Step 4: Create queue item (replace 'QUEUE_ID_HERE' with the actual queueId from Step 3)
-- If no queue exists, you'll need to create one first

-- First, create queue if it doesn't exist:
INSERT INTO queues (
  id,
  "clinicId",
  "doctorId",
  date,
  "sessionId",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  "clinicId",
  "doctorId",
  DATE("appointmentDate"),
  "sessionId",
  NOW(),
  NOW()
FROM appointments
WHERE id = '21490b1f-e873-4414-b896-694836459e1c'
ON CONFLICT ("clinicId", "doctorId", date, "sessionId") DO NOTHING;

-- Then create the queue item:
INSERT INTO queue_items (
  id,
  "queueId",
  "appointmentId",
  "patientId",
  "queueNumber",
  status,
  position,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  q.id,
  '21490b1f-e873-4414-b896-694836459e1c',
  a."patientId",
  1,  -- Queue number 1
  'WAITING',
  1,  -- Position 1
  NOW(),
  NOW()
FROM appointments a
JOIN queues q ON 
  q."clinicId" = a."clinicId" 
  AND q."doctorId" = a."doctorId"
  AND q.date = DATE(a."appointmentDate")
  AND (q."sessionId" = a."sessionId" OR (q."sessionId" IS NULL AND a."sessionId" IS NULL))
WHERE a.id = '21490b1f-e873-4414-b896-694836459e1c'
ON CONFLICT DO NOTHING;

-- Step 5: Verify the fix
SELECT 
  a.id,
  a.status as appointment_status,
  a."queueNumber",
  qi."queueNumber" as queue_item_number,
  qi.status as queue_status,
  p.status as payment_status
FROM appointments a
LEFT JOIN payments p ON p."appointmentId" = a.id
LEFT JOIN queue_items qi ON qi."appointmentId" = a.id
WHERE a.id = '21490b1f-e873-4414-b896-694836459e1c';
