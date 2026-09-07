-- Debug why patient names aren't showing in queue

-- Step 1: Check the queue item and its patient relationship
SELECT 
  qi.id as queue_item_id,
  qi."queueNumber",
  qi."patientId",
  u.id as user_id,
  u.name as user_name,
  u.mobile as user_mobile,
  CASE 
    WHEN qi."patientId" = u.id THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as id_match
FROM queue_items qi
LEFT JOIN users u ON u.id = qi."patientId"
WHERE qi."createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY qi."queueNumber" ASC
LIMIT 10;

-- Step 2: Check if patientId in queue_items points to valid users
SELECT 
  qi.id,
  qi."queueNumber",
  qi."patientId",
  CASE 
    WHEN u.id IS NOT NULL THEN 'User exists'
    ELSE '❌ User not found'
  END as user_status,
  u.name,
  u.mobile
FROM queue_items qi
LEFT JOIN users u ON u.id = qi."patientId"
WHERE qi."createdAt" > NOW() - INTERVAL '24 hours'
AND qi.status IN ('WAITING', 'CALLED', 'IN_CONSULTATION')
ORDER BY qi."queueNumber";

-- Step 3: Find queue items where patient name is NULL
SELECT 
  qi.id,
  qi."queueNumber",
  qi."patientId",
  u.name as patient_name,
  u.mobile
FROM queue_items qi
LEFT JOIN users u ON u.id = qi."patientId"
WHERE qi."createdAt" > NOW() - INTERVAL '24 hours'
AND (u.name IS NULL OR u.name = '' OR u.name = 'Patient')
ORDER BY qi."queueNumber";

-- Step 4: Check appointment -> patient relationship
SELECT 
  qi."queueNumber",
  qi."patientId" as queue_patient_id,
  a."patientId" as appointment_patient_id,
  u.name,
  u.mobile,
  CASE 
    WHEN qi."patientId" = a."patientId" THEN '✅ IDs match'
    ELSE '❌ ID mismatch'
  END as patient_id_consistency
FROM queue_items qi
LEFT JOIN appointments a ON a.id = qi."appointmentId"
LEFT JOIN users u ON u.id = qi."patientId"
WHERE qi."createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY qi."queueNumber";
