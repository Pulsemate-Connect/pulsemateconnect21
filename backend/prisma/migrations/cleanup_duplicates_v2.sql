-- ============================================================================
-- CLEANUP DUPLICATE QUEUE NUMBERS - BETTER APPROACH
-- ============================================================================

-- Reassign queue numbers sequentially within each queue
WITH ranked_items AS (
  SELECT 
    id,
    "queueId",
    ROW_NUMBER() OVER (
      PARTITION BY "queueId"
      ORDER BY "createdAt" ASC, id ASC
    ) as new_queue_number
  FROM queue_items
)
UPDATE queue_items qi
SET "queueNumber" = ri.new_queue_number
FROM ranked_items ri
WHERE qi.id = ri.id;

-- Verify: This should return 0 rows
SELECT "queueId", "queueNumber", COUNT(*) as cnt
FROM queue_items
GROUP BY "queueId", "queueNumber"
HAVING COUNT(*) > 1;
