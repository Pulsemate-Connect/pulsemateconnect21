-- CreateTable: doctor_availabilities
CREATE TABLE "doctor_availabilities" (
    "id"              TEXT        NOT NULL,
    "doctorId"        TEXT        NOT NULL,
    "clinicId"        TEXT        NOT NULL,
    "dayOfWeek"       INTEGER     NOT NULL,
    "startTime"       TEXT        NOT NULL,
    "endTime"         TEXT        NOT NULL,
    "slotDurationMin" INTEGER     NOT NULL DEFAULT 15,
    "maxPatients"     INTEGER     NOT NULL DEFAULT 20,
    "isActive"        BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_availabilities_doctorId_clinicId_dayOfWeek_key"
    ON "doctor_availabilities"("doctorId", "clinicId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "doctor_availabilities"
    ADD CONSTRAINT "doctor_availabilities_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availabilities"
    ADD CONSTRAINT "doctor_availabilities_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "clinics"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
