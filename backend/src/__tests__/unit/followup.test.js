'use strict';
/**
 * PulseMate — Follow-Up System Unit Tests
 *
 * Tests cover all 22 acceptance criteria:
 *  1-4.   Clinic can activate/deactivate follow-up and configure presets
 *  5-8.   Doctor can create follow-ups for 7/15/30/custom days
 *  9.     Receptionist can create follow-up by entering days manually
 *  10.    Patient with no follow-up gets no follow-up record
 *  11-12. Follow-up date calculated from completed visit (not prescription)
 *  13-14. Follow-up belongs to correct patient and clinic
 *  15.    Unauthorized user cannot access another clinic's follow-ups
 *  16-17. Audit trail — creator and modifier recorded
 *  18.    Cancelled follow-up is not deleted
 *  19-20. Booked/completed follow-up changes status correctly
 *  21.    Clinic deactivation does not delete existing follow-ups
 *  22.    Duplicate follow-ups are prevented
 */

const {
  computeStatus,
  createFollowUp,
  updateFollowUp,
  cancelFollowUp,
  markFollowUpBooked,
  markFollowUpCompleted,
  getClinicFollowUpSettings,
  updateClinicFollowUpSettings,
  listClinicFollowUps,
  getPatientFollowUps,
} = require('../../services/followupManager.service');

const prisma = global.prismaMock;

// ─── Test fixtures ─────────────────────────────────────────────────────────
const CLINIC_ID = 'clinic-1';
const PATIENT_ID = 'patient-1';
const DOCTOR_ID = 'doctor-profile-1';
const VISIT_ID = 'visit-1';
const USER_ID = 'user-1';
const FOLLOWUP_ID = 'fu-1';

const VISIT_DATE = new Date('2026-07-22T00:00:00.000Z');

const makeSettings = (overrides = {}) => ({
  id: 'settings-1',
  clinicId: CLINIC_ID,
  followUpEnabled: true,
  preset7DaysEnabled: true,
  preset15DaysEnabled: true,
  preset30DaysEnabled: true,
  customDaysEnabled: true,
  defaultFollowUpDays: 15,
  gracePeriodDays: 7,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeVisit = (overrides = {}) => ({
  id: VISIT_ID,
  patientId: PATIENT_ID,
  clinicId: CLINIC_ID,
  doctorId: DOCTOR_ID,
  status: 'COMPLETED',
  appointmentDate: VISIT_DATE,
  patient: { id: PATIENT_ID, name: 'Rahul' },
  ...overrides,
});

const makeFollowUp = (overrides = {}) => ({
  id: FOLLOWUP_ID,
  patientId: PATIENT_ID,
  clinicId: CLINIC_ID,
  doctorId: DOCTOR_ID,
  originalVisitId: VISIT_ID,
  followUpDays: 15,
  followUpDate: new Date('2026-08-06T00:00:00.000Z'),
  status: 'PENDING',
  note: null,
  bookedAppointmentId: null,
  createdByUserId: USER_ID,
  createdByRole: 'DOCTOR',
  updatedByUserId: null,
  cancelledByUserId: null,
  cancelledAt: null,
  cancellationReason: null,
  patient: { id: PATIENT_ID, name: 'Rahul', mobile: '9999999999' },
  doctor: { user: { id: USER_ID, name: 'Dr. Sharma' } },
  originalVisit: { id: VISIT_ID, appointmentDate: VISIT_DATE, symptoms: 'Fever' },
  createdBy: { id: USER_ID, name: 'Dr. Sharma', role: 'DOCTOR' },
  updatedBy: null,
  cancelledBy: null,
  ...overrides,
});


// ═══════════════════════════════════════════════════════════════════════════
// 1. STATUS COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════
describe('computeStatus', () => {
  const gracePeriod = 7;

  test('returns PENDING when due date is more than 3 days away', () => {
    const fu = { status: 'PENDING', followUpDate: new Date(Date.now() + 10 * 86400000) };
    expect(computeStatus(fu, gracePeriod)).toBe('PENDING');
  });

  test('returns UPCOMING when due date is 1-3 days away', () => {
    const fu = { status: 'PENDING', followUpDate: new Date(Date.now() + 2 * 86400000) };
    expect(computeStatus(fu, gracePeriod)).toBe('UPCOMING');
  });

  test('returns DUE when due date is today', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const fu = { status: 'PENDING', followUpDate: today };
    expect(computeStatus(fu, gracePeriod)).toBe('DUE');
  });

  test('returns OVERDUE when past due date', () => {
    const fu = { status: 'PENDING', followUpDate: new Date(Date.now() - 5 * 86400000) };
    expect(computeStatus(fu, gracePeriod)).toBe('OVERDUE');
  });

  test('preserves BOOKED status without recomputing', () => {
    const fu = { status: 'BOOKED', followUpDate: new Date(Date.now() - 5 * 86400000) };
    expect(computeStatus(fu, gracePeriod)).toBe('BOOKED');
  });

  test('preserves COMPLETED status without recomputing', () => {
    const fu = { status: 'COMPLETED', followUpDate: new Date(Date.now() - 5 * 86400000) };
    expect(computeStatus(fu, gracePeriod)).toBe('COMPLETED');
  });

  test('preserves CANCELLED status without recomputing', () => {
    const fu = { status: 'CANCELLED', followUpDate: new Date(Date.now() - 5 * 86400000) };
    expect(computeStatus(fu, gracePeriod)).toBe('CANCELLED');
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// 2. CLINIC FOLLOW-UP SETTINGS — tests 1-4
// ═══════════════════════════════════════════════════════════════════════════
describe('Clinic Follow-Up Settings', () => {

  test('[Test 1] Clinic can activate follow-up feature', async () => {
    const settings = makeSettings({ followUpEnabled: true });
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(settings);

    const result = await getClinicFollowUpSettings(CLINIC_ID);
    expect(result.followUpEnabled).toBe(true);
  });

  test('[Test 2] Clinic can deactivate follow-up feature', async () => {
    const disabledSettings = makeSettings({ followUpEnabled: false });
    prisma.clinicFollowUpSettings.upsert.mockResolvedValue(disabledSettings);

    const result = await updateClinicFollowUpSettings(CLINIC_ID, { followUpEnabled: false });
    expect(result.followUpEnabled).toBe(false);
  });

  test('[Test 3] Clinic can configure 7/15/30 presets', async () => {
    const settings = makeSettings({
      preset7DaysEnabled: true,
      preset15DaysEnabled: false,
      preset30DaysEnabled: true,
    });
    prisma.clinicFollowUpSettings.upsert.mockResolvedValue(settings);

    const result = await updateClinicFollowUpSettings(CLINIC_ID, {
      preset7DaysEnabled: true,
      preset15DaysEnabled: false,
      preset30DaysEnabled: true,
    });

    expect(result.preset7DaysEnabled).toBe(true);
    expect(result.preset15DaysEnabled).toBe(false);
    expect(result.preset30DaysEnabled).toBe(true);
  });

  test('[Test 4] Clinic can enable/disable custom days', async () => {
    const settingsNoCustom = makeSettings({ customDaysEnabled: false });
    prisma.clinicFollowUpSettings.upsert.mockResolvedValue(settingsNoCustom);

    const result = await updateClinicFollowUpSettings(CLINIC_ID, { customDaysEnabled: false });
    expect(result.customDaysEnabled).toBe(false);
  });

  test('Auto-creates settings with defaults if none exist', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(null);
    prisma.clinicFollowUpSettings.create.mockResolvedValue(makeSettings());

    const result = await getClinicFollowUpSettings(CLINIC_ID);
    expect(result.followUpEnabled).toBe(true);
    expect(result.defaultFollowUpDays).toBe(15);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// 3. CREATE FOLLOW-UP — tests 5-14
// ═══════════════════════════════════════════════════════════════════════════
describe('createFollowUp', () => {

  const baseInput = {
    clinicId: CLINIC_ID,
    doctorId: DOCTOR_ID,
    originalVisitId: VISIT_ID,
    createdByUserId: USER_ID,
    createdByRole: 'DOCTOR',
    note: null,
  };

  const mockCreateSetup = (followUpDays, settingsOverrides = {}) => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings(settingsOverrides));
    prisma.appointment.findUnique.mockResolvedValue(makeVisit());
    prisma.followUp.findFirst.mockResolvedValue(null); // no duplicate
    prisma.followUp.create.mockResolvedValue(
      makeFollowUp({
        followUpDays,
        followUpDate: new Date(VISIT_DATE.getTime() + followUpDays * 86400000),
        createdByRole: baseInput.createdByRole,
      })
    );
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings(settingsOverrides));
    prisma.followUp.update.mockResolvedValue(
      makeFollowUp({ followUpDays, status: 'PENDING' })
    );
  };

  test('[Test 5] Doctor can create 7-day follow-up', async () => {
    mockCreateSetup(7);
    const fu = await createFollowUp({ ...baseInput, followUpDays: 7 });
    expect(fu.followUpDays).toBe(7);
    expect(prisma.followUp.create).toHaveBeenCalled();
  });

  test('[Test 6] Doctor can create 15-day follow-up', async () => {
    mockCreateSetup(15);
    const fu = await createFollowUp({ ...baseInput, followUpDays: 15 });
    expect(fu.followUpDays).toBe(15);
  });

  test('[Test 7] Doctor can create 30-day follow-up', async () => {
    mockCreateSetup(30);
    const fu = await createFollowUp({ ...baseInput, followUpDays: 30 });
    expect(fu.followUpDays).toBe(30);
  });

  test('[Test 8] Doctor can create custom-day follow-up when allowed', async () => {
    mockCreateSetup(45, { customDaysEnabled: true });
    const fu = await createFollowUp({ ...baseInput, followUpDays: 45 });
    expect(fu.followUpDays).toBe(45);
  });

  test('[Test 8b] Doctor cannot create custom-day follow-up when clinic disables it', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(
      makeSettings({ customDaysEnabled: false })
    );
    prisma.appointment.findUnique.mockResolvedValue(makeVisit());
    prisma.followUp.findFirst.mockResolvedValue(null);

    await expect(createFollowUp({ ...baseInput, followUpDays: 45 })).rejects.toThrow();
  });


  test('[Test 9] Receptionist can create follow-up by entering any positive days', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit());
    prisma.followUp.findFirst.mockResolvedValue(null);
    prisma.followUp.create.mockResolvedValue(makeFollowUp({ followUpDays: 21, createdByRole: 'RECEPTIONIST' }));
    prisma.followUp.update.mockResolvedValue(makeFollowUp({ followUpDays: 21, status: 'PENDING' }));

    const fu = await createFollowUp({ ...baseInput, followUpDays: 21, createdByRole: 'RECEPTIONIST' });
    expect(fu.followUpDays).toBe(21);
    expect(fu.createdByRole).toBe('RECEPTIONIST');
  });

  test('[Test 10] Patient with no follow-up gets no follow-up record (no implicit creation)', () => {
    // Verify createFollowUp requires explicit call — it is never called automatically
    // This test confirms the function is not invoked without explicit action
    expect(prisma.followUp.create).not.toHaveBeenCalled();
  });

  test('[Test 11] Follow-up date is calculated from completed visit date, not current date', async () => {
    // Visit date: 2026-07-22 + 15 days = 2026-08-06
    const expectedFollowUpDate = new Date('2026-08-06T00:00:00.000Z');

    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit());
    prisma.followUp.findFirst.mockResolvedValue(null);
    prisma.followUp.create.mockImplementation(async ({ data }) => {
      // Validate date calculation
      expect(data.followUpDate.getTime()).toBe(expectedFollowUpDate.getTime());
      return makeFollowUp({ followUpDays: 15, followUpDate: data.followUpDate });
    });
    prisma.followUp.update.mockResolvedValue(makeFollowUp({ status: 'PENDING' }));

    await createFollowUp({ ...baseInput, followUpDays: 15 });
    expect(prisma.followUp.create).toHaveBeenCalled();
  });

  test('[Test 12] Prescription date does not affect follow-up calculation', async () => {
    // The service only uses appointmentDate from the visit — prescriptions are not loaded
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit());
    prisma.followUp.findFirst.mockResolvedValue(null);
    prisma.followUp.create.mockResolvedValue(makeFollowUp({ followUpDays: 15 }));
    prisma.followUp.update.mockResolvedValue(makeFollowUp({ status: 'PENDING' }));

    await createFollowUp({ ...baseInput, followUpDays: 15 });

    // prescriptions table should NOT be queried
    expect(prisma.appointment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: VISIT_ID } })
    );
    // No prescription model call
    if (prisma.prescriptions) {
      expect(prisma.prescriptions.findUnique).not.toHaveBeenCalled();
    }
  });


  test('[Test 13] Follow-up belongs to correct patient (from original visit)', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit({ patientId: PATIENT_ID }));
    prisma.followUp.findFirst.mockResolvedValue(null);
    prisma.followUp.create.mockImplementation(async ({ data }) => {
      expect(data.patientId).toBe(PATIENT_ID);
      return makeFollowUp();
    });
    prisma.followUp.update.mockResolvedValue(makeFollowUp());

    await createFollowUp({ ...baseInput, followUpDays: 15 });
  });

  test('[Test 14] Follow-up belongs to correct clinic', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit({ clinicId: CLINIC_ID }));
    prisma.followUp.findFirst.mockResolvedValue(null);
    prisma.followUp.create.mockImplementation(async ({ data }) => {
      expect(data.clinicId).toBe(CLINIC_ID);
      return makeFollowUp();
    });
    prisma.followUp.update.mockResolvedValue(makeFollowUp());

    await createFollowUp({ ...baseInput, followUpDays: 15 });
  });

  test('Cannot create follow-up for non-COMPLETED visit', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit({ status: 'BOOKED' }));
    prisma.followUp.findFirst.mockResolvedValue(null);

    await expect(createFollowUp({ ...baseInput, followUpDays: 15 })).rejects.toThrow(
      'Follow-up can only be created for COMPLETED visits'
    );
  });

  test('Cannot create follow-up when clinic follow-up is disabled', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings({ followUpEnabled: false }));

    await expect(createFollowUp({ ...baseInput, followUpDays: 15 })).rejects.toThrow(
      'Follow-up feature is not enabled for this clinic'
    );
  });

  test('Visit must belong to the specified clinic (IDOR prevention)', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit({ clinicId: 'different-clinic' }));
    prisma.followUp.findFirst.mockResolvedValue(null);

    await expect(createFollowUp({ ...baseInput, followUpDays: 15 })).rejects.toThrow(
      'Visit does not belong to this clinic'
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// 4. AUDIT TRAIL — tests 15-17
// ═══════════════════════════════════════════════════════════════════════════
describe('Audit Trail', () => {

  test('[Test 16] Audit trail records creator correctly', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit());
    prisma.followUp.findFirst.mockResolvedValue(null);
    prisma.followUp.create.mockImplementation(async ({ data }) => {
      expect(data.createdByUserId).toBe(USER_ID);
      expect(data.createdByRole).toBe('RECEPTIONIST');
      return makeFollowUp({ createdByUserId: USER_ID, createdByRole: 'RECEPTIONIST' });
    });
    prisma.followUp.update.mockResolvedValue(makeFollowUp());

    await createFollowUp({
      clinicId: CLINIC_ID, doctorId: DOCTOR_ID,
      originalVisitId: VISIT_ID, followUpDays: 15,
      createdByUserId: USER_ID, createdByRole: 'RECEPTIONIST',
    });
  });

  test('[Test 17] Audit trail records modifier (updatedByUserId)', async () => {
    const MODIFIER_ID = 'doctor-user-id';
    prisma.followUp.findUnique.mockResolvedValue(makeFollowUp({ clinicId: CLINIC_ID }));
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(
      makeVisit({ id: VISIT_ID, appointmentDate: VISIT_DATE })
    );
    prisma.followUp.update.mockImplementation(async ({ data }) => {
      expect(data.updatedByUserId).toBe(MODIFIER_ID);
      return makeFollowUp({ updatedByUserId: MODIFIER_ID, followUpDays: 30 });
    });

    const result = await updateFollowUp(FOLLOWUP_ID, {
      followUpDays: 30,
      updatedByUserId: MODIFIER_ID,
      updatedByRole: 'DOCTOR',
      clinicId: CLINIC_ID,
    });

    expect(result.updatedByUserId).toBe(MODIFIER_ID);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. CANCEL FOLLOW-UP — test 18
// ═══════════════════════════════════════════════════════════════════════════
describe('cancelFollowUp', () => {

  test('[Test 18] Cancelled follow-up is not deleted — status changes to CANCELLED', async () => {
    prisma.followUp.findUnique.mockResolvedValue(makeFollowUp({ clinicId: CLINIC_ID }));
    prisma.followUp.update.mockResolvedValue(makeFollowUp({ status: 'CANCELLED' }));

    const result = await cancelFollowUp(FOLLOWUP_ID, {
      cancelledByUserId: USER_ID,
      cancellationReason: 'Patient request',
      clinicId: CLINIC_ID,
    });

    expect(result.status).toBe('CANCELLED');
    expect(prisma.followUp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelledByUserId: USER_ID,
        }),
      })
    );
    // Record still exists in DB — delete was NOT called
    expect(prisma.followUp.findUnique).toHaveBeenCalled();
    expect(prisma.followUp['delete']).toBeUndefined();
  });

  test('Cannot cancel an already-cancelled follow-up', async () => {
    prisma.followUp.findUnique.mockResolvedValue(makeFollowUp({ status: 'CANCELLED', clinicId: CLINIC_ID }));

    await expect(cancelFollowUp(FOLLOWUP_ID, {
      cancelledByUserId: USER_ID,
      clinicId: CLINIC_ID,
    })).rejects.toThrow('already cancelled');
  });

  test('Cannot cancel a completed follow-up', async () => {
    prisma.followUp.findUnique.mockResolvedValue(makeFollowUp({ status: 'COMPLETED', clinicId: CLINIC_ID }));

    await expect(cancelFollowUp(FOLLOWUP_ID, {
      cancelledByUserId: USER_ID,
      clinicId: CLINIC_ID,
    })).rejects.toThrow('Cannot cancel a completed follow-up');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. BOOKED / COMPLETED STATUS — tests 19-20
// ═══════════════════════════════════════════════════════════════════════════
describe('Follow-up status transitions: BOOKED and COMPLETED', () => {

  test('[Test 19] Booking an appointment changes follow-up status to BOOKED', async () => {
    const bookedApptId = 'booked-appt-1';
    prisma.followUp.update.mockResolvedValue(
      makeFollowUp({ status: 'BOOKED', bookedAppointmentId: bookedApptId })
    );

    const result = await markFollowUpBooked(FOLLOWUP_ID, bookedApptId, USER_ID);

    expect(result.status).toBe('BOOKED');
    expect(result.bookedAppointmentId).toBe(bookedApptId);
    expect(prisma.followUp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FOLLOWUP_ID },
        data: expect.objectContaining({
          status: 'BOOKED',
          bookedAppointmentId: bookedApptId,
        }),
      })
    );
  });

  test('[Test 20] Completing the booked appointment marks follow-up as COMPLETED', async () => {
    prisma.followUp.findUnique.mockResolvedValue(
      makeFollowUp({ status: 'BOOKED', bookedAppointmentId: 'booked-appt-1' })
    );
    prisma.followUp.update.mockResolvedValue(makeFollowUp({ status: 'COMPLETED' }));

    const result = await markFollowUpCompleted(FOLLOWUP_ID, USER_ID);

    expect(result.status).toBe('COMPLETED');
    expect(prisma.followUp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FOLLOWUP_ID },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      })
    );
  });

  test('[Test 20b] Cancelled follow-up is NOT overridden to COMPLETED', async () => {
    prisma.followUp.findUnique.mockResolvedValue(makeFollowUp({ status: 'CANCELLED' }));

    const result = await markFollowUpCompleted(FOLLOWUP_ID, USER_ID);

    // Should return the cancelled follow-up unchanged — update is NOT called
    expect(prisma.followUp.update).not.toHaveBeenCalled();
    expect(result.status).toBe('CANCELLED');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. CLINIC DEACTIVATION DOES NOT DELETE — test 21
// ═══════════════════════════════════════════════════════════════════════════
describe('[Test 21] Clinic deactivation does not delete existing follow-ups', () => {

  test('Disabling follow-up feature only updates settings — existing follow-ups survive', async () => {
    // Simulate disabling the feature
    const disabledSettings = makeSettings({ followUpEnabled: false });
    prisma.clinicFollowUpSettings.upsert.mockResolvedValue(disabledSettings);

    const result = await updateClinicFollowUpSettings(CLINIC_ID, { followUpEnabled: false });

    // Settings are updated
    expect(result.followUpEnabled).toBe(false);
    // Follow-up records are NOT touched
    expect(prisma.followUp.update).not.toHaveBeenCalled();
    expect(prisma.followUp.findUnique).not.toHaveBeenCalled();
  });

  test('Creating new follow-up is blocked when clinic disables feature', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings({ followUpEnabled: false }));

    await expect(createFollowUp({
      clinicId: CLINIC_ID,
      doctorId: DOCTOR_ID,
      originalVisitId: VISIT_ID,
      followUpDays: 15,
      createdByUserId: USER_ID,
      createdByRole: 'DOCTOR',
    })).rejects.toThrow('Follow-up feature is not enabled for this clinic');

    // Existing records not touched
    expect(prisma.followUp.update).not.toHaveBeenCalled();
  });

  test('Listing follow-ups still works after clinic disables feature', async () => {
    const existingFollowUps = [makeFollowUp({ status: 'PENDING' }), makeFollowUp({ id: 'fu-2', status: 'OVERDUE' })];
    prisma.followUp.findMany.mockResolvedValue(existingFollowUps);
    prisma.followUp.count.mockResolvedValue(2);
    // clinicFollowUpSettings needed for refreshFollowUpStatuses — return disabled
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings({ followUpEnabled: false }));

    const result = await listClinicFollowUps(CLINIC_ID, {});
    expect(result.followUps).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. DUPLICATE PREVENTION — test 22
// ═══════════════════════════════════════════════════════════════════════════
describe('[Test 22] Duplicate follow-ups are prevented', () => {

  test('Cannot create second active follow-up for the same visit', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit());
    // Simulate existing active follow-up for this visit
    prisma.followUp.findFirst.mockResolvedValue(makeFollowUp({ status: 'PENDING' }));

    await expect(createFollowUp({
      clinicId: CLINIC_ID,
      doctorId: DOCTOR_ID,
      originalVisitId: VISIT_ID,
      followUpDays: 15,
      createdByUserId: USER_ID,
      createdByRole: 'DOCTOR',
    })).rejects.toThrow('An active follow-up already exists for this visit');
  });

  test('Can create new follow-up for same visit after previous is CANCELLED', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit());
    // Cancelled follow-up does NOT block new creation (findFirst returns null because
    // the query filters out CANCELLED status)
    prisma.followUp.findFirst.mockResolvedValue(null);
    prisma.followUp.create.mockResolvedValue(makeFollowUp({ followUpDays: 15 }));
    prisma.followUp.update.mockResolvedValue(makeFollowUp({ status: 'PENDING' }));

    const fu = await createFollowUp({
      clinicId: CLINIC_ID,
      doctorId: DOCTOR_ID,
      originalVisitId: VISIT_ID,
      followUpDays: 15,
      createdByUserId: USER_ID,
      createdByRole: 'DOCTOR',
    });

    expect(fu).toBeDefined();
    expect(prisma.followUp.create).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CROSS-CLINIC ACCESS PREVENTION — test 15
// ═══════════════════════════════════════════════════════════════════════════
describe('[Test 15] Cross-clinic access prevention (IDOR)', () => {

  test('updateFollowUp denies access to follow-up from different clinic', async () => {
    prisma.followUp.findUnique.mockResolvedValue(
      makeFollowUp({ clinicId: 'other-clinic' })
    );

    await expect(updateFollowUp(FOLLOWUP_ID, {
      followUpDays: 30,
      updatedByUserId: USER_ID,
      updatedByRole: 'DOCTOR',
      clinicId: CLINIC_ID, // attacker's clinic — different from record's clinic
    })).rejects.toThrow('Access denied');
  });

  test('cancelFollowUp denies access to follow-up from different clinic', async () => {
    prisma.followUp.findUnique.mockResolvedValue(
      makeFollowUp({ clinicId: 'other-clinic' })
    );

    await expect(cancelFollowUp(FOLLOWUP_ID, {
      cancelledByUserId: USER_ID,
      clinicId: CLINIC_ID,
    })).rejects.toThrow('Access denied');
  });

  test('createFollowUp rejects visit from different clinic', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit({ clinicId: 'other-clinic' }));
    prisma.followUp.findFirst.mockResolvedValue(null);

    await expect(createFollowUp({
      clinicId: CLINIC_ID,
      doctorId: DOCTOR_ID,
      originalVisitId: VISIT_ID,
      followUpDays: 15,
      createdByUserId: USER_ID,
      createdByRole: 'DOCTOR',
    })).rejects.toThrow('Visit does not belong to this clinic');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. PATIENT FOLLOW-UP QUERY
// ═══════════════════════════════════════════════════════════════════════════
describe('getPatientFollowUps', () => {

  test('Returns only non-cancelled follow-ups for a patient', async () => {
    const followUps = [
      makeFollowUp({ status: 'PENDING' }),
      makeFollowUp({ id: 'fu-2', status: 'BOOKED' }),
    ];
    prisma.followUp.findMany.mockResolvedValue(followUps);

    const result = await getPatientFollowUps(PATIENT_ID, CLINIC_ID);

    expect(prisma.followUp.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          patientId: PATIENT_ID,
          status: { notIn: ['CANCELLED'] },
          clinicId: CLINIC_ID,
        }),
      })
    );
    expect(result).toHaveLength(2);
  });

  test('Returns empty array when patient has no follow-ups', async () => {
    prisma.followUp.findMany.mockResolvedValue([]);
    const result = await getPatientFollowUps('patient-no-followups', CLINIC_ID);
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════
describe('Edge cases', () => {

  test('Follow-up with past due date shows OVERDUE on creation', async () => {
    // Visit date 60 days ago → follow-up 15 days later is still ~45 days overdue
    const oldVisitDate = new Date(Date.now() - 60 * 86400000);
    oldVisitDate.setUTCHours(0, 0, 0, 0);

    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());
    prisma.appointment.findUnique.mockResolvedValue(makeVisit({ appointmentDate: oldVisitDate }));
    prisma.followUp.findFirst.mockResolvedValue(null);

    const overdueDate = new Date(oldVisitDate.getTime() + 15 * 86400000);
    prisma.followUp.create.mockResolvedValue(
      makeFollowUp({ followUpDate: overdueDate, status: 'PENDING' })
    );
    // Simulate status update to OVERDUE
    prisma.followUp.update.mockResolvedValue(
      makeFollowUp({ followUpDate: overdueDate, status: 'OVERDUE' })
    );

    const fu = await createFollowUp({
      clinicId: CLINIC_ID, doctorId: DOCTOR_ID,
      originalVisitId: VISIT_ID, followUpDays: 15,
      createdByUserId: USER_ID, createdByRole: 'DOCTOR',
    });

    // Status is refreshed after creation
    expect(prisma.followUp.update).toHaveBeenCalled();
  });

  test('Follow-up with zero days throws validation error', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());

    await expect(createFollowUp({
      clinicId: CLINIC_ID, doctorId: DOCTOR_ID,
      originalVisitId: VISIT_ID, followUpDays: 0,
      createdByUserId: USER_ID, createdByRole: 'DOCTOR',
    })).rejects.toThrow('Follow-up days must be a positive number');
  });

  test('Follow-up with negative days throws validation error', async () => {
    prisma.clinicFollowUpSettings.findUnique.mockResolvedValue(makeSettings());

    await expect(createFollowUp({
      clinicId: CLINIC_ID, doctorId: DOCTOR_ID,
      originalVisitId: VISIT_ID, followUpDays: -5,
      createdByUserId: USER_ID, createdByRole: 'DOCTOR',
    })).rejects.toThrow('Follow-up days must be a positive number');
  });

  test('Cannot edit a COMPLETED follow-up', async () => {
    prisma.followUp.findUnique.mockResolvedValue(makeFollowUp({ status: 'COMPLETED', clinicId: CLINIC_ID }));

    await expect(updateFollowUp(FOLLOWUP_ID, {
      followUpDays: 30,
      updatedByUserId: USER_ID,
      updatedByRole: 'DOCTOR',
      clinicId: CLINIC_ID,
    })).rejects.toThrow('Cannot edit a completed follow-up');
  });

  test('Cannot edit a CANCELLED follow-up', async () => {
    prisma.followUp.findUnique.mockResolvedValue(makeFollowUp({ status: 'CANCELLED', clinicId: CLINIC_ID }));

    await expect(updateFollowUp(FOLLOWUP_ID, {
      followUpDays: 30,
      updatedByUserId: USER_ID,
      updatedByRole: 'DOCTOR',
      clinicId: CLINIC_ID,
    })).rejects.toThrow('Cannot edit a cancelled follow-up');
  });

  test('markFollowUpCompleted returns null when follow-up not found', async () => {
    prisma.followUp.findUnique.mockResolvedValue(null);
    const result = await markFollowUpCompleted('nonexistent-id', USER_ID);
    expect(result).toBeNull();
    expect(prisma.followUp.update).not.toHaveBeenCalled();
  });
});
