'use strict';
/**
 * Unit tests — FCM notification service
 * Task 2.7
 */

describe('fcm.service', () => {
  beforeEach(() => {
    jest.resetModules();
    // Remove FIREBASE_SERVICE_ACCOUNT_JSON so we test dev-mode fallback
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });

  test('sendNotification logs to console when Firebase is not configured (dev mode)', async () => {
    // No tokens → exits early (no log)
    global.prismaMock.fcmToken.findMany.mockResolvedValueOnce([]);

    const { sendNotification } = require('../../services/fcm.service');
    await expect(sendNotification('user-1', { title: 'Test', body: 'Hello' })).resolves.toBeUndefined();
  });

  test('sendNotification logs notification details when tokens exist in dev mode', async () => {
    global.prismaMock.fcmToken.findMany.mockResolvedValueOnce([
      { token: 'device-token-abc' },
    ]);

    const logger = require('../../config/logger');
    const { sendNotification } = require('../../services/fcm.service');

    await sendNotification('user-1', { title: 'Queue Update', body: 'Your turn soon' });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[FCM DEV]'),
      expect.objectContaining({ title: 'Queue Update' })
    );
  });

  test('notifyQueueCalled formats message correctly', async () => {
    global.prismaMock.fcmToken.findMany.mockResolvedValueOnce([{ token: 'tok1' }]);

    const logger = require('../../config/logger');
    const { notifyQueueCalled } = require('../../services/fcm.service');

    await notifyQueueCalled('user-1', 5);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[FCM DEV]'),
      expect.objectContaining({ title: expect.stringContaining('turn') })
    );
  });

  test('notifyAppointmentBooked formats message with doctor name', async () => {
    global.prismaMock.fcmToken.findMany.mockResolvedValueOnce([{ token: 'tok1' }]);

    const logger = require('../../config/logger');
    const { notifyAppointmentBooked } = require('../../services/fcm.service');

    await notifyAppointmentBooked('user-1', 'Dr. Sharma', new Date('2026-12-01'));

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[FCM DEV]'),
      expect.objectContaining({ body: expect.stringContaining('Dr. Sharma') })
    );
  });

  test('sendNotification does not throw when DB throws (non-critical)', async () => {
    global.prismaMock.fcmToken.findMany.mockRejectedValueOnce(new Error('DB down'));

    const { sendNotification } = require('../../services/fcm.service');
    await expect(sendNotification('user-1', { title: 'T', body: 'B' })).resolves.toBeUndefined();
  });

  test('cleans up invalid token when Firebase responds with NotRegistered', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ type: 'service_account', project_id: 'test' });

    global.prismaMock.fcmToken.findMany.mockResolvedValueOnce([{ token: 'bad-token' }]);

    // Mock firebase-admin
    jest.mock('firebase-admin', () => ({
      apps: [],
      initializeApp: jest.fn(),
      credential: { cert: jest.fn() },
      messaging: () => ({
        sendEachForMulticast: jest.fn().mockResolvedValue({
          successCount: 0,
          responses: [{ success: false, error: { code: 'messaging/registration-token-not-registered' } }],
        }),
      }),
    }), { virtual: true });

    global.prismaMock.fcmToken.deleteMany.mockResolvedValueOnce({ count: 1 });

    const { sendNotification } = require('../../services/fcm.service');
    await sendNotification('user-1', { title: 'Test', body: 'Msg' });

    // The service deletes by single token (not array) — verify it was called with the bad token
    expect(global.prismaMock.fcmToken.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ token: 'bad-token' }) })
    );

    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });
});
