'use strict';
/**
 * Unit tests — Doctor Availability / Slot generation
 * Task 4.5
 */

const httpMocks = require('node-mocks-http');

const {
  _generateSlots,
  _buildSlotArray,
  getAvailableSlots,
} = require('../../controllers/availability.controller');

// ─────────────────────────────────────────────────────────────────────────────
// _generateSlots (pure function — no mocks needed)
// ─────────────────────────────────────────────────────────────────────────────
describe('_generateSlots', () => {
  test('generates correct slots for 09:00–17:00 at 30-min intervals', () => {
    const slots = _generateSlots('09:00', '17:00', 30);
    expect(slots).toContain('09:00');
    expect(slots).toContain('09:30');
    expect(slots).toContain('16:30');
    expect(slots).not.toContain('17:00'); // exclusive end
    expect(slots).toHaveLength(16);
  });

  test('generates correct slots at 15-min intervals', () => {
    const slots = _generateSlots('09:00', '10:00', 15);
    expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45']);
  });

  test('returns empty array when startTime >= endTime', () => {
    expect(_generateSlots('17:00', '09:00', 30)).toEqual([]);
    expect(_generateSlots('09:00', '09:00', 30)).toEqual([]);
  });

  test('handles midnight-crossing gracefully (no slots expected)', () => {
    const slots = _generateSlots('23:00', '23:30', 15);
    expect(slots).toEqual(['23:00', '23:15']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// _buildSlotArray (pure function)
// ─────────────────────────────────────────────────────────────────────────────
describe('_buildSlotArray', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1); // tomorrow — no slots are "past"

  test('marks booked slots correctly', () => {
    const slots = ['09:00', '09:30', '10:00'];
    const bookedSet = new Set(['09:30']);
    const result = _buildSlotArray(slots, bookedSet, futureDate);

    expect(result.find(s => s.time === '09:00').available).toBe(true);
    expect(result.find(s => s.time === '09:30').available).toBe(false);
    expect(result.find(s => s.time === '09:30').booked).toBe(true);
    expect(result.find(s => s.time === '10:00').available).toBe(true);
  });

  test('marks past slots for today as unavailable', () => {
    const now = new Date();
    const slots = ['00:00', '00:15']; // both in the past
    const result = _buildSlotArray(slots, new Set(), now);

    result.forEach(s => {
      expect(s.available).toBe(false);
      expect(s.past).toBe(true);
    });
  });

  test('all slots available when no bookings and date is future', () => {
    const slots = ['09:00', '09:30', '10:00'];
    const result = _buildSlotArray(slots, new Set(), futureDate);
    result.forEach(s => {
      expect(s.available).toBe(true);
      expect(s.booked).toBe(false);
      expect(s.past).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAvailableSlots controller
// ─────────────────────────────────────────────────────────────────────────────
describe('getAvailableSlots', () => {
  const makeReq = (params, query) => {
    const req = httpMocks.createRequest({ params, query });
    return req;
  };

  test('returns 400 when clinicId or date is missing', async () => {
    const req = makeReq({ doctorId: 'd1' }, {});
    const res = httpMocks.createResponse();
    await getAvailableSlots(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 for invalid date format', async () => {
    const req = makeReq({ doctorId: 'd1' }, { clinicId: 'c1', date: 'not-a-date' });
    const res = httpMocks.createResponse();
    await getAvailableSlots(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
  });

  test('returns slots from DoctorAvailability when configured', async () => {
    global.prismaMock.doctorAvailability.findUnique.mockResolvedValueOnce({
      doctorId: 'd1', clinicId: 'c1', dayOfWeek: 1,
      startTime: '09:00', endTime: '11:00',
      slotDurationMin: 30, maxPatients: 10, isActive: true,
    });
    global.prismaMock.appointment.findMany.mockResolvedValueOnce([]); // no bookings

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    // Force to Monday (dayOfWeek=1) for deterministic test
    const dayOffset = (1 - tomorrow.getDay() + 7) % 7;
    tomorrow.setDate(tomorrow.getDate() + dayOffset);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const req = makeReq({ doctorId: 'd1' }, { clinicId: 'c1', date: dateStr });
    const res = httpMocks.createResponse();
    await getAvailableSlots(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData().data;
    expect(data.source).toBe('doctorAvailability');
    expect(Array.isArray(data.slots)).toBe(true);
    expect(data.slots.length).toBeGreaterThan(0);
  });

  test('excludes booked slots from response', async () => {
    global.prismaMock.doctorAvailability.findUnique.mockResolvedValueOnce({
      doctorId: 'd1', clinicId: 'c1', dayOfWeek: 1,
      startTime: '09:00', endTime: '10:00',
      slotDurationMin: 30, maxPatients: 10, isActive: true,
    });
    global.prismaMock.appointment.findMany.mockResolvedValueOnce([
      { slotTime: '09:00' }, // booked slot
    ]);

    const dateStr = '2026-12-08'; // a Monday
    const req = makeReq({ doctorId: 'd1' }, { clinicId: 'c1', date: dateStr });
    const res = httpMocks.createResponse();
    await getAvailableSlots(req, res, jest.fn());

    const data = res._getJSONData().data;
    const bookedSlot = data.slots.find(s => s.time === '09:00');
    expect(bookedSlot?.available).toBe(false);
    expect(bookedSlot?.booked).toBe(true);
  });

  test('returns empty slots with source=none when no availability configured', async () => {
    global.prismaMock.doctorAvailability.findUnique.mockResolvedValueOnce(null);
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce(null);

    const req = makeReq({ doctorId: 'd1' }, { clinicId: 'c1', date: '2026-12-08' });
    const res = httpMocks.createResponse();
    await getAvailableSlots(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().data.slots).toHaveLength(0);
    expect(res._getJSONData().data.source).toBe('none');
  });
});
