-- ============================================================================
-- CLEANUP DUPLICATE DATA BEFORE APPLYING UNIQUE CONSTRAINTS
-- ============================================================================

-- Step 1: Find and fix duplicate queue numbers
-- Keep the oldest queue item for each (queueId, queueNumber) pair
WITH duplicates AS (
  SELECT 
    id,
    "queueId",
    "queueNumber",
    ROW_NUMBER() OVER (
      PARTITION BY "queueId", "queueNumber" 
      ORDER BY "createdAt" ASC
    ) as rn
  FROM queue_items
)
UPDATE queue_items qi
SET "queueNumber" = qi."queueNumber" + 10000 + (SELECT COUNT(*) FROM queue_items WHERE "queueId" = qi."queueId")
FROM duplicates d
WHERE qi.id = d.id
  AND d.rn > 1;

-- Step 2: Find and log duplicate slots (for reference)
SELECT 
  "doctorId", 
  "clinicId", 
  "appointmentDate"::date as date, 
  "slotTime", 
  COUNT(*) as duplicate_count
FROM appointments
WHERE status NOT IN ('CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT')
  AND "slotTime" IS NOT NULL
GROUP BY "doctorId", "clinicId", "appointmentDate"::date, "slotTime"
HAVING COUNT(*) > 1;

-- Step 3: Fix duplicate slots by cancelling the later bookings
-- Keep the earliest created appointment, cancel the rest
WITH duplicate_slots AS (
  SELECT 
    id,
    "doctorId",
    "clinicId",
    "appointmentDate"::date as date,
    "slotTime",
    ROW_NUMBER() OVER (
      PARTITION BY "doctorId", "clinicId", "appointmentDate"::date, "slotTime"
      ORDER BY "createdAt" ASC
    ) as rn
  FROM appointments
  WHERE status NOT IN ('CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT')
    AND "slotTime" IS NOT NULL
)
UPDATE appointments a
SET status = 'CANCELLED'
FROM duplicate_slots ds
WHERE a.id = ds.id
  AND ds.rn > 1;

-- Step 4: Verify cleanup
SELECT 'Queue items with duplicate numbers:' as check_type, COUNT(*) as count
FROM (
  SELECT "queueId", "queueNumber", COUNT(*) as cnt
  FROM queue_items
  GROUP BY "queueId", "queueNumber"
  HAVING COUNT(*) > 1
) as dups
UNION ALL
SELECT 'Appointments with duplicate slots:' as check_type, COUNT(*) as count
FROM (
  SELECT "doctorId", "clinicId", "appointmentDate"::date, "slotTime", COUNT(*) as cnt
  FROM appointments
  WHERE status NOT IN ('CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT')
    AND "slotTime" IS NOT NULL
  GROUP BY "doctorId", "clinicId", "appointmentDate"::date, "slotTime"
  HAVING COUNT(*) > 1
) as dups;
