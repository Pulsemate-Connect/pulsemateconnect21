'use strict';
/**
 * Unit tests — Notification controller (Phase 8)
 * Tests FCM token registration, getMyNotifications, mark read, mark all read
 */

const httpMocks = require('node-mocks-http');

const {
  registerFcmToken,
  removeFcmToken,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../../controllers/notification.controller');

// ─────────────────────────────────────────────────────────────────────────────
// registerFcmToken
// ─────────────────────────────────────────────────────────────────────────────
describe('registerFcmToken', () => {
  const makeReq = (body) => {
    const req = httpMocks.createRequest({ method: 'POST', body });
    req.user = { id: 'user-1' };
    return req;
  };

  test('returns 400 when token is missing', async () => {
    const req = makeReq({});
    const res = httpMocks.createResponse();
    await registerFcmToken(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
  });

  test('registers token successfully', async () => {
    global.prismaMock.fcmToken.upsert.mockResolvedValueOnce({ token: 'tok-1', userId: 'user-1' });

    const req = makeReq({ token: 'tok-1', platform: 'android' });
    const res = httpMocks.createResponse();
    await registerFcmToken(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(global.prismaMock.fcmToken.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { token: 'tok-1' } })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// removeFcmToken
// ─────────────────────────────────────────────────────────────────────────────
describe('removeFcmToken', () => {
  const makeReq = (body) => {
    const req = httpMocks.createRequest({ method: 'DELETE', body });
    req.user = { id: 'user-1' };
    return req;
  };

  test('returns 400 when token is missing', async () => {
    const req = makeReq({});
    const res = httpMocks.createResponse();
    await removeFcmToken(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
  });

  test('deletes token successfully', async () => {
    global.prismaMock.fcmToken.deleteMany.mockResolvedValueOnce({ count: 1 });

    const req = makeReq({ token: 'tok-1' });
    const res = httpMocks.createResponse();
    await removeFcmToken(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(global.prismaMock.fcmToken.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { token: 'tok-1', userId: 'user-1' } })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getMyNotifications
// ─────────────────────────────────────────────────────────────────────────────
describe('getMyNotifications', () => {
  const makeReq = () => {
    const req = httpMocks.createRequest({ method: 'GET' });
    req.user = { id: 'patient-1' };
    return req;
  };

  test('returns notifications and unreadCount for patient with no appointments', async () => {
    global.prismaMock.appointment.findMany
      .mockResolvedValueOnce([])   // todayAppts
      .mockResolvedValueOnce([]);  // recentAppts
    global.prismaMock.user.findUnique.mockResolvedValueOnce({
      createdAt: new Date('2026-01-01'),
      name: 'Alice',
      freeBookingUsed: false,
    });
    global.prismaMock.notificationRead.findMany.mockResolvedValueOnce([]);

    const res = httpMocks.createResponse();
    await getMyNotifications(makeReq(), res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData().data;
    expect(Array.isArray(data.notifications)).toBe(true);
    expect(typeof data.unreadCount).toBe('number');
    // Free booking offer should be in the list (freeBookingUsed: false)
    const freeOffer = data.notifications.find(n => n.id === 'free_booking_offer');
    expect(freeOffer).toBeDefined();
    expect(freeOffer.type).toBe('OFFER');
  });

  test('excludes free_booking_offer when benefit already used', async () => {
    global.prismaMock.appointment.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    global.prismaMock.user.findUnique.mockResolvedValueOnce({
      createdAt: new Date('2026-01-01'),
      name: 'Bob',
      freeBookingUsed: true,  // ← already used
    });
    global.prismaMock.notificationRead.findMany.mockResolvedValueOnce([]);

    const res = httpMocks.createResponse();
    await getMyNotifications(makeReq(), res, jest.fn());

    const data = res._getJSONData().data;
    const freeOffer = data.notifications.find(n => n.id === 'free_booking_offer');
    expect(freeOffer).toBeUndefined();
  });

  test('includes QUEUE_CALLED notification when appointment status is CALLED', async () => {
    const calledAppt = {
      id: 'appt-called-1',
      status: 'CALLED',
      queueNumber: 3,
      slotTime: '10:00',
      estimatedWaitMinutes: 10,
      createdAt: new Date(),
      doctor: { user: { name: 'Dr. Singh' } },
      clinic: { name: 'City Clinic' },
      queueItem: { id: 'qi1', status: 'CALLED' },
    };
    global.prismaMock.appointment.findMany
      .mockResolvedValueOnce([calledAppt])  // todayAppts
      .mockResolvedValueOnce([]);            // recentAppts
    global.prismaMock.user.findUnique.mockResolvedValueOnce({
      createdAt: new Date(), name: 'Alice', freeBookingUsed: true,
    });
    global.prismaMock.notificationRead.findMany.mockResolvedValueOnce([]);

    const res = httpMocks.createResponse();
    await getMyNotifications(makeReq(), res, jest.fn());

    const data = res._getJSONData().data;
    const queueCalledNotif = data.notifications.find(n => n.type === 'QUEUE_CALLED');
    expect(queueCalledNotif).toBeDefined();
    expect(queueCalledNotif.read).toBe(false); // unread by default
  });

  test('marks notification as read when id is in readSet', async () => {
    global.prismaMock.appointment.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    global.prismaMock.user.findUnique.mockResolvedValueOnce({
      createdAt: new Date(), name: 'Alice', freeBookingUsed: false,
    });
    // free_booking_offer is in readSet
    global.prismaMock.notificationRead.findMany.mockResolvedValueOnce([
      { notificationId: 'free_booking_offer' },
    ]);

    const res = httpMocks.createResponse();
    await getMyNotifications(makeReq(), res, jest.fn());

    const data = res._getJSONData().data;
    const freeOffer = data.notifications.find(n => n.id === 'free_booking_offer');
    expect(freeOffer?.read).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markNotificationRead
// ─────────────────────────────────────────────────────────────────────────────
describe('markNotificationRead', () => {
  test('upserts read record and returns 200', async () => {
    global.prismaMock.notificationRead.upsert.mockResolvedValueOnce({});

    const req = httpMocks.createRequest({ params: { id: 'queue_abc' } });
    req.user = { id: 'patient-1' };
    const res = httpMocks.createResponse();
    await markNotificationRead(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(global.prismaMock.notificationRead.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_notificationId: { userId: 'patient-1', notificationId: 'queue_abc' } },
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markAllNotificationsRead
// ─────────────────────────────────────────────────────────────────────────────
describe('markAllNotificationsRead', () => {
  test('marks all notifications read and returns 200', async () => {
    global.prismaMock.appointment.findMany
      .mockResolvedValueOnce([{ id: 'a1', status: 'BOOKED' }])  // todayAppts
      .mockResolvedValueOnce([{ id: 'a2' }]);                    // recentAppts
    global.prismaMock.notificationRead.upsert.mockResolvedValue({});

    const req = httpMocks.createRequest({ method: 'PATCH' });
    req.user = { id: 'patient-1' };
    const res = httpMocks.createResponse();
    await markAllNotificationsRead(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    // upsert should be called for each notification ID generated
    expect(global.prismaMock.notificationRead.upsert).toHaveBeenCalled();
  });
});
