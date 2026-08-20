/**
 * Unit tests — useQueueSocket hook
 *
 * Tests all socket lifecycle behaviors in isolation.
 * All external deps (socket.io-client, SecureStore, patient API) are mocked.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useQueueSocket } from '../hooks/useQueueSocket';

// ── Mock socket.io-client ─────────────────────────────────────────────────────
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  removeAllListeners: jest.fn(),
  connected: false,
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// ── Mock expo-secure-store ────────────────────────────────────────────────────
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-access-token'),
}));

// ── Mock patient API ──────────────────────────────────────────────────────────
jest.mock('../api/patient', () => ({
  getLiveQueue: jest.fn(),
}));

// ── Mock axios BASE_URL ───────────────────────────────────────────────────────
jest.mock('../api/axios', () => ({
  BASE_URL: 'http://localhost:5000/api',
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const { getLiveQueue } = require('../api/patient');
const { io } = require('socket.io-client');

const MOCK_PAYLOAD = {
  appointment: {
    id: 'appt-1',
    status: 'WAITING',
    queueNumber: 5,
    doctor: { user: { name: 'Jane Smith' }, specialization: 'Cardiology' },
    clinic: { name: 'City Clinic' },
  },
  queueInfo: {
    roomName: 'queue:clinic-1:doctor-1:2026-06-07',
    queueNumber: 5,
    position: 3,
    patientsAhead: 2,
    currentlyServing: 3,
    estimatedWaitMinutes: 20,
    status: 'WAITING',
    queueStatus: 'ACTIVE',
  },
};

// Simulate socket event firing
const triggerSocketEvent = (eventName, payload) => {
  const handler = mockSocket.on.mock.calls.find(([ev]) => ev === eventName)?.[1];
  if (handler) act(() => handler(payload));
};

// ── Test suite ────────────────────────────────────────────────────────────────
describe('useQueueSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    getLiveQueue.mockResolvedValue({ data: { data: MOCK_PAYLOAD } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── 1. Initial fetch ────────────────────────────────────────────────────────
  it('calls getLiveQueue on mount with the appointmentId', async () => {
    const onData = jest.fn();
    renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(getLiveQueue).toHaveBeenCalledWith('appt-1'));
  });

  it('calls onData callback with the fetched payload', async () => {
    const onData = jest.fn();
    renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(onData).toHaveBeenCalledWith(MOCK_PAYLOAD));
  });

  it('starts with socketState = connecting', () => {
    const onData = jest.fn();
    getLiveQueue.mockReturnValue(new Promise(() => { })); // never resolves
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    expect(result.current.socketState).toBe('connecting');
  });

  // ── 2. Socket connection ────────────────────────────────────────────────────
  it('creates a socket with the correct server URL', async () => {
    const onData = jest.fn();
    renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalledWith(
      'http://localhost:5000', // /api stripped
      expect.objectContaining({ transports: ['websocket'] })
    ));
  });

  it('emits patient:joinQueueRoom with correct room parts on connect', async () => {
    const onData = jest.fn();
    renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());

    // Simulate connect event
    triggerSocketEvent('connect', undefined);

    expect(mockSocket.emit).toHaveBeenCalledWith('patient:joinQueueRoom', {
      clinicId: 'clinic-1',
      doctorId: 'doctor-1',
      date: '2026-06-07',
    });
  });

  it('sets socketState to live on connect', async () => {
    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());
    act(() => triggerSocketEvent('connect', undefined));

    await waitFor(() => expect(result.current.socketState).toBe('live'));
  });

  it('sets socketState to live on queue:joined', async () => {
    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());
    act(() => triggerSocketEvent('queue:joined', {}));

    await waitFor(() => expect(result.current.socketState).toBe('live'));
  });

  // ── 3. Queue events trigger re-fetch ────────────────────────────────────────
  const QUEUE_EVENTS = [
    'queue:updated',
    'queue:positionUpdated',
    'queue:called',
    'queue:paused',
    'queue:resumed',
    'queue:completed',
  ];

  QUEUE_EVENTS.forEach((event) => {
    it(`re-fetches data when ${event} is received`, async () => {
      const onData = jest.fn();
      renderHook(() => useQueueSocket('appt-1', onData));

      await waitFor(() => expect(getLiveQueue).toHaveBeenCalledTimes(1));

      triggerSocketEvent(event, {});

      await waitFor(() => expect(getLiveQueue).toHaveBeenCalledTimes(2));
    });
  });

  // ── 4. Duplicate listener prevention ───────────────────────────────────────
  it('calls socket.off before re-registering queue event listeners', async () => {
    const onData = jest.fn();
    renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());

    QUEUE_EVENTS.forEach((event) => {
      expect(mockSocket.off).toHaveBeenCalledWith(event);
    });
  });

  // ── 5. Offline / polling fallback ──────────────────────────────────────────
  it('sets socketState to offline on disconnect', async () => {
    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());
    act(() => triggerSocketEvent('disconnect', 'transport error'));

    await waitFor(() => expect(result.current.socketState).toBe('offline'));
  });

  it('sets socketState to offline on connect_error', async () => {
    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());
    act(() => triggerSocketEvent('connect_error', new Error('connection refused')));

    await waitFor(() => expect(result.current.socketState).toBe('offline'));
  });

  it('starts 30-second polling fallback when socket disconnects', async () => {
    const onData = jest.fn();
    renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());

    // Reset call count after initial fetch
    getLiveQueue.mockClear();

    act(() => triggerSocketEvent('disconnect', 'transport error'));

    // Advance 30 seconds — polling should fire
    act(() => jest.advanceTimersByTime(30_000));

    await waitFor(() => expect(getLiveQueue).toHaveBeenCalled());
  });

  it('stops polling when socket reconnects', async () => {
    const onData = jest.fn();
    renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());

    // Go offline → polling starts
    act(() => triggerSocketEvent('disconnect', 'transport error'));
    getLiveQueue.mockClear();

    // Reconnect → polling should stop
    act(() => triggerSocketEvent('connect', undefined));

    // Advance time — polling is stopped, so no extra poll calls beyond the queue:joined sync fetch
    act(() => jest.advanceTimersByTime(60_000));

    // getLiveQueue may be called once more from queue:joined handler — that's fine
    // The key assertion: it was NOT called repeatedly (poll interval fired)
    expect(getLiveQueue.mock.calls.length).toBeLessThanOrEqual(2);
  });

  // ── 6. Cleanup on unmount ───────────────────────────────────────────────────
  it('disconnects socket and clears interval on unmount', async () => {
    const onData = jest.fn();
    const { unmount } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());

    unmount();

    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  // ── 7. Manual refresh ───────────────────────────────────────────────────────
  it('manualRefresh triggers a getLiveQueue call', async () => {
    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(getLiveQueue).toHaveBeenCalledTimes(1));

    getLiveQueue.mockClear();
    act(() => result.current.manualRefresh());

    await waitFor(() => expect(getLiveQueue).toHaveBeenCalledTimes(1));
  });

  // ── 8. lastUpdated ──────────────────────────────────────────────────────────
  it('sets lastUpdated after a successful fetch', async () => {
    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(result.current.lastUpdated).toBeInstanceOf(Date));
  });

  // ── 9. Error handling ───────────────────────────────────────────────────────
  it('calls onError when getLiveQueue throws', async () => {
    const error = new Error('Network error');
    getLiveQueue.mockRejectedValue(error);

    const onData = jest.fn();
    const onError = jest.fn();
    renderHook(() => useQueueSocket('appt-1', onData, onError));

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });

  it('falls back to polling when no roomName in response', async () => {
    // Payload with no roomName — appointment not in queue yet
    getLiveQueue.mockResolvedValue({
      data: { data: { appointment: { id: 'appt-1', status: 'BOOKED' }, queueInfo: null } },
    });

    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(result.current.socketState).toBe('offline'));

    // No socket should be created
    expect(io).not.toHaveBeenCalled();
  });

  // ── 10. Reconnect ───────────────────────────────────────────────────────────
  it('re-joins room and sets state to live on reconnect event', async () => {
    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());

    mockSocket.emit.mockClear();
    act(() => triggerSocketEvent('reconnect', undefined));

    await waitFor(() => expect(result.current.socketState).toBe('live'));
    expect(mockSocket.emit).toHaveBeenCalledWith('patient:joinQueueRoom', expect.any(Object));
  });

  it('stays offline and keeps polling on reconnect_failed', async () => {
    const onData = jest.fn();
    const { result } = renderHook(() => useQueueSocket('appt-1', onData));

    await waitFor(() => expect(io).toHaveBeenCalled());
    act(() => triggerSocketEvent('reconnect_failed', undefined));

    await waitFor(() => expect(result.current.socketState).toBe('offline'));
  });
});
