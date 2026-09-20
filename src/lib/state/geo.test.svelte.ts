import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geoState } from './geo.svelte';

const SESSION_MS = 30 * 60_000;

type SuccessCallback = (position: { coords: { latitude: number; longitude: number } }) => void;
type ErrorCallback = (error: { code: number; PERMISSION_DENIED: number }) => void;

const getCurrentPosition = vi.fn<(ok: SuccessCallback, fail: ErrorCallback) => void>();

/** Answers each call with the next fix, then holds the last one. */
function answersWith(first: [number, number], ...rest: [number, number][]) {
  const queue = [first, ...rest];
  let last = first;
  getCurrentPosition.mockImplementation((ok) => {
    last = queue.shift() ?? last;
    ok({ coords: { latitude: last[0], longitude: last[1] } });
  });
}

function fails(code: number) {
  getCurrentPosition.mockImplementation((_ok, fail) => {
    fail({ code, PERMISSION_DENIED: 1 });
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  getCurrentPosition.mockReset();
  answersWith([41.4, 2.1]);
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
  geoState.position = null;
  geoState.status = 'idle';
});

afterEach(() => {
  geoState.stop();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('geoState tracking session', () => {
  it('takes a fix immediately and starts following', () => {
    geoState.start();

    expect(geoState.tracking).toBe(true);
    expect(geoState.following).toBe(true);
    expect(geoState.remaining).toBe(1);
    expect(geoState.position).toEqual({ lat: 41.4, lng: 2.1 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — a second start does not restart the session', () => {
    geoState.start();
    vi.advanceTimersByTime(10_000);
    geoState.start();

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(geoState.remaining).toBeLessThan(1);
  });

  it('refreshes the fix every 30 seconds', () => {
    answersWith([41.4, 2.1], [41.5, 2.2], [41.6, 2.3]);
    geoState.start();

    vi.advanceTimersByTime(30_000);
    expect(geoState.position).toEqual({ lat: 41.5, lng: 2.2 });

    vi.advanceTimersByTime(30_000);
    expect(geoState.position).toEqual({ lat: 41.6, lng: 2.3 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(3);
  });

  it('drains remaining from 1 to 0 across the session', () => {
    geoState.start();

    vi.advanceTimersByTime(SESSION_MS / 2);
    expect(geoState.remaining).toBeCloseTo(0.5, 2);

    vi.advanceTimersByTime(SESSION_MS / 2);
    expect(geoState.remaining).toBe(0);
  });

  it('stops itself at expiry and clears the interval', () => {
    geoState.start();
    vi.advanceTimersByTime(SESSION_MS);

    expect(geoState.tracking).toBe(false);
    expect(geoState.following).toBe(false);

    const callsAtExpiry = getCurrentPosition.mock.calls.length;
    vi.advanceTimersByTime(5 * 60_000);
    expect(getCurrentPosition).toHaveBeenCalledTimes(callsAtExpiry);
  });

  it('keeps the last fix on stop so a restart paints instantly', () => {
    geoState.start();
    geoState.stop();

    expect(geoState.tracking).toBe(false);
    expect(geoState.position).toEqual({ lat: 41.4, lng: 2.1 });
  });

  it('toggles a running session off', () => {
    geoState.toggle();
    expect(geoState.tracking).toBe(true);

    geoState.toggle();
    expect(geoState.tracking).toBe(false);
  });

  it('resumes following instead of stopping when the lock was broken', () => {
    answersWith([41.4, 2.1], [41.5, 2.2]);
    geoState.start();
    geoState.stopFollowing();

    geoState.toggle();

    expect(geoState.following).toBe(true);
    expect(geoState.tracking).toBe(true);

    // The interval is untouched, so fixes keep arriving.
    vi.advanceTimersByTime(30_000);
    expect(geoState.position).toEqual({ lat: 41.5, lng: 2.2 });
  });

  it('stops on the next toggle once following has been resumed', () => {
    geoState.start();
    geoState.stopFollowing();
    geoState.toggle();
    geoState.toggle();

    expect(geoState.tracking).toBe(false);
    expect(geoState.following).toBe(false);
  });
});

describe('geoState.stopFollowing', () => {
  it('ends the follow lock but keeps the fixes coming', () => {
    answersWith([41.4, 2.1], [41.5, 2.2]);
    geoState.start();

    geoState.stopFollowing();
    expect(geoState.following).toBe(false);
    expect(geoState.tracking).toBe(true);

    vi.advanceTimersByTime(30_000);
    expect(geoState.position).toEqual({ lat: 41.5, lng: 2.2 });
  });
});

describe('geoState error handling', () => {
  it('stops the session when permission is refused', () => {
    fails(1);
    geoState.start();

    expect(geoState.status).toBe('denied');
    expect(geoState.tracking).toBe(false);
  });

  it('keeps tracking and retries when a fix is merely unavailable', () => {
    geoState.start();
    expect(geoState.position).toEqual({ lat: 41.4, lng: 2.1 });

    fails(2);
    vi.advanceTimersByTime(30_000);

    expect(geoState.tracking).toBe(true);
    expect(geoState.position).toEqual({ lat: 41.4, lng: 2.1 });

    answersWith([41.7, 2.4]);
    vi.advanceTimersByTime(30_000);
    expect(geoState.position).toEqual({ lat: 41.7, lng: 2.4 });
  });
});
