-- CreateTable: reminder_sent
-- Tracks which appointment reminders have already been sent to prevent duplicates.

CREATE TABLE "reminder_sent" (
    "id"            TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "type"          TEXT NOT NULL,
    "sentAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_sent_pkey" PRIMARY KEY ("id")
);

-- UniqueIndex: one reminder per appointment per type
CREATE UNIQUE INDEX "reminder_sent_appointmentId_type_key"
    ON "reminder_sent"("appointmentId", "type");

-- ForeignKey: cascade delete when appointment is deleted
ALTER TABLE "reminder_sent"
    ADD CONSTRAINT "reminder_sent_appointmentId_fkey"
    FOREIGN KEY ("appointmentId")
    REFERENCES "appointments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
