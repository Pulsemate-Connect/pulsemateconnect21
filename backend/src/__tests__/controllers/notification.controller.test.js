const request = require('supertest');
const { app } = require('../../server');
const prisma = require('../../config/database');

describe('Notification Controller', () => {
  let testUser;
  let testNotifications;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'notification-test@test.com',
        phone: '9999999999',
        role: 'PATIENT',
        isVerified: true,
      },
    });

    // Create test notifications
    testNotifications = await Promise.all([
      prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed',
          message: 'Your appointment is confirmed',
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'QUEUE_CALLED',
          title: 'Your Turn',
          message: 'Please proceed to consultation',
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'BOOKING_COMPLETED',
          title: 'Appointment Completed',
          message: 'Thank you for visiting',
          isRead: true,
        },
      }),
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.notification.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(response.body.notifications.length).toBe(3);

      // Should be sorted by newest first
      const timestamps = response.body.notifications.map(n => new Date(n.createdAt).getTime());
      const sortedTimestamps = [...timestamps].sort((a, b) => b - a);
      expect(timestamps).toEqual(sortedTimestamps);
    });

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({ userId: testUser.id, unreadOnly: 'true' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications.length).toBe(2);
      response.body.notifications.forEach(notification => {
        expect(notification.isRead).toBe(false);
      });
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({ userId: testUser.id, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications.length).toBe(2);
    });

    it('should return 400 without userId', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('userId is required');
    });

    it('should return empty array for user with no notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({ userId: 'non-existent-user' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toEqual([]);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.unreadCount).toBe(2);
    });

    it('should return 0 for user with no unread notifications', async () => {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: testUser.id },
        data: { isRead: true },
      });

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.unreadCount).toBe(0);

      // Reset for other tests
      await prisma.notification.updateMany({
        where: { 
          userId: testUser.id,
          id: { in: [testNotifications[0].id, testNotifications[1].id] }
        },
        data: { isRead: false },
      });
    });

    it('should return 400 without userId', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const unreadNotification = testNotifications[0];

      const response = await request(app)
        .patch(`/api/notifications/${unreadNotification.id}/read`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notification.isRead).toBe(true);

      // Verify in database
      const updated = await prisma.notification.findUnique({
        where: { id: unreadNotification.id },
      });
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).not.toBeNull();
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .patch('/api/notifications/non-existent-id/read')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should be idempotent (marking read notification as read)', async () => {
      const readNotification = testNotifications[2];

      const response = await request(app)
        .patch(`/api/notifications/${readNotification.id}/read`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notification.isRead).toBe(true);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    beforeEach(async () => {
      // Reset notifications to unread
      await prisma.notification.updateMany({
        where: { userId: testUser.id },
        data: { isRead: false, readAt: null },
      });
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .patch('/api/notifications/read-all')
        .send({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('marked as read');

      // Verify in database
      const unreadCount = await prisma.notification.count({
        where: { userId: testUser.id, isRead: false },
      });
      expect(unreadCount).toBe(0);
    });

    it('should return 400 without userId', async () => {
      const response = await request(app)
        .patch('/api/notifications/read-all')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('userId is required');
    });

    it('should handle user with no notifications', async () => {
      const response = await request(app)
        .patch('/api/notifications/read-all')
        .send({ userId: 'non-existent-user' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Notification Performance', () => {
    it('should handle concurrent mark as read requests', async () => {
      const requests = testNotifications.map(notification =>
        request(app).patch(`/api/notifications/${notification.id}/read`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should retrieve notifications quickly', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/notifications')
        .query({ userId: testUser.id })
        .expect(200);
      const duration = Date.now() - start;

      // Should complete within 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});
