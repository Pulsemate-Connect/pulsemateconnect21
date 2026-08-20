-- Add avgConsultationMins to clinic_sessions
-- Default 15 minutes per patient for slot time calculation
ALTER TABLE "clinic_sessions" ADD COLUMN IF NOT EXISTS "avgConsultationMins" INTEGER NOT NULL DEFAULT 15;
