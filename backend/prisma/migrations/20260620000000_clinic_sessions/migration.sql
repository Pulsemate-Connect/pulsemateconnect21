-- CreateTable: clinic_sessions
CREATE TABLE "clinic_sessions" (
    "id"              TEXT         NOT NULL,
    "clinicId"        TEXT         NOT NULL,
    "sessionName"     TEXT         NOT NULL,
    "startTime"       TEXT         NOT NULL,
    "endTime"         TEXT         NOT NULL,
    "maxAppointments" INTEGER      DEFAULT 20,
    "isActive"        BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "clinic_sessions"
    ADD CONSTRAINT "clinic_sessions_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "clinics"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
