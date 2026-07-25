/*
  Warnings:

  - A unique constraint covering the columns `[clinicId,doctorId,date,sessionId]` on the table `queues` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[firebaseUid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "idx_appointment_clinic_created";

-- DropIndex
DROP INDEX "queues_clinicId_doctorId_date_key";

-- DropIndex
DROP INDEX "queues_sessionId_idx";

-- DropIndex
DROP INDEX "users_deletionRequestedAt_idx";

-- CreateTable
CREATE TABLE "clinic_owner_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryClinicId" TEXT,
    "businessName" TEXT,
    "designation" TEXT,
    "profilePhoto" TEXT,
    "alternatePhone" TEXT,
    "businessAddress" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "bio" TEXT,
    "linkedInProfile" TEXT,
    "yearsInHealthcare" INTEGER,
    "totalClinics" INTEGER NOT NULL DEFAULT 1,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_owner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinic_owner_profiles_userId_key" ON "clinic_owner_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_owner_profiles_primaryClinicId_key" ON "clinic_owner_profiles"("primaryClinicId");

-- CreateIndex
CREATE INDEX "clinic_owner_profiles_userId_idx" ON "clinic_owner_profiles"("userId");

-- CreateIndex
CREATE INDEX "clinic_owner_profiles_primaryClinicId_idx" ON "clinic_owner_profiles"("primaryClinicId");

-- CreateIndex
CREATE INDEX "appointments_patientId_appointmentDate_idx" ON "appointments"("patientId", "appointmentDate");

-- CreateIndex
CREATE INDEX "appointments_doctorId_appointmentDate_idx" ON "appointments"("doctorId", "appointmentDate");

-- CreateIndex
CREATE INDEX "appointments_clinicId_status_appointmentDate_idx" ON "appointments"("clinicId", "status", "appointmentDate");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "payments_patientId_createdAt_idx" ON "payments"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_status_paidAt_idx" ON "payments"("status", "paidAt");

-- CreateIndex
CREATE INDEX "payments_razorpayOrderId_idx" ON "payments"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "queue_items_queueId_status_idx" ON "queue_items"("queueId", "status");

-- CreateIndex
CREATE INDEX "queue_items_patientId_idx" ON "queue_items"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "queues_clinicId_doctorId_date_sessionId_key" ON "queues"("clinicId", "doctorId", "date", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinic_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_owner_profiles" ADD CONSTRAINT "clinic_owner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_owner_profiles" ADD CONSTRAINT "clinic_owner_profiles_primaryClinicId_fkey" FOREIGN KEY ("primaryClinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
