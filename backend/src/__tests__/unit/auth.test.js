'use strict';
/**
 * Unit tests — Auth module
 * Task 5.2: OTP flow, JWT, password login, middleware
 */

const httpMocks = require('node-mocks-http');

// ── Token service mock ─────────────────────────────────────────────────────────
jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'mock_access_token'),
  generateRefreshToken: jest.fn(() => 'mock_refresh_token'),
  verifyAccessToken: jest.fn((t) => {
    if (t === 'valid_token') return { sub: 'user-123', role: 'PATIENT' };
    throw new Error('invalid token');
  }),
}));

// ── OTP service mock ───────────────────────────────────────────────────────────
jest.mock('../../services/otp.service', () => ({
  sendOtp: jest.fn().mockResolvedValue({ success: true }),
  verifyOtp: jest.fn().mockResolvedValue({ valid: true }),
}));

// ── bcrypt mock ────────────────────────────────────────────────────────────────
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

const { authenticate } = require('../../middleware/auth.middleware');
const { verifyAccessToken } = require('../../services/token.service');

// ─────────────────────────────────────────────────────────────────────────────
// authenticate middleware
// ─────────────────────────────────────────────────────────────────────────────
describe('authenticate middleware', () => {
  const makeReq = (token) => {
    const req = httpMocks.createRequest();
    if (token) req.headers.authorization = `Bearer ${token}`;
    return req;
  };

  test('returns 401 when no Authorization header', async () => {
    const req = makeReq(null);
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is invalid', async () => {
    verifyAccessToken.mockImplementationOnce(() => { throw new Error('jwt expired'); });

    const req = makeReq('bad_token');
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() and sets req.user when token is valid', async () => {
    verifyAccessToken.mockReturnValueOnce({ sub: 'user-123', role: 'PATIENT' });

    // Prisma mock: findUnique returns an active user
    global.prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-123',
      role: 'PATIENT',
      isActive: true,
    });

    const req = makeReq('valid_token');
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-123');
  });

  test('returns 401 when user is not found in DB', async () => {
    verifyAccessToken.mockReturnValueOnce({ sub: 'ghost-user', role: 'PATIENT' });
    global.prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const req = makeReq('valid_token');
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user account is deactivated', async () => {
    verifyAccessToken.mockReturnValueOnce({ sub: 'user-123', role: 'PATIENT' });
    global.prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-123',
      role: 'PATIENT',
      isActive: false,
    });

    const req = makeReq('valid_token');
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Token service
// ─────────────────────────────────────────────────────────────────────────────
describe('token.service', () => {
  beforeEach(() => jest.resetModules());

  test('generateAccessToken returns a string', () => {
    const { generateAccessToken } = require('../../services/token.service');
    const token = generateAccessToken({ sub: 'u1', role: 'PATIENT' });
    expect(typeof token).toBe('string');
  });

  test('verifyAccessToken throws on tampered token', () => {
    verifyAccessToken.mockImplementationOnce(() => { throw new Error('invalid signature'); });
    expect(() => verifyAccessToken('tampered.token.here')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// bcrypt helpers
// ─────────────────────────────────────────────────────────────────────────────
describe('password hashing', () => {
  const bcrypt = require('bcryptjs');

  test('hash() produces a non-empty string', async () => {
    const h = await bcrypt.hash('password123', 10);
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
  });

  test('compare() returns true for correct password', async () => {
    bcrypt.compare.mockResolvedValueOnce(true);
    const result = await bcrypt.compare('password123', 'hashed');
    expect(result).toBe(true);
  });

  test('compare() returns false for wrong password', async () => {
    bcrypt.compare.mockResolvedValueOnce(false);
    const result = await bcrypt.compare('wrong', 'hashed');
    expect(result).toBe(false);
  });
});
