/*
  Warnings:

  - A unique constraint covering the columns `[firebaseUid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "clinic_holidays" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinic_holidays_clinicId_idx" ON "clinic_holidays"("clinicId");

-- CreateIndex
CREATE INDEX "clinic_holidays_date_idx" ON "clinic_holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_holidays_clinicId_date_key" ON "clinic_holidays"("clinicId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- AddForeignKey
ALTER TABLE "clinic_holidays" ADD CONSTRAINT "clinic_holidays_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
