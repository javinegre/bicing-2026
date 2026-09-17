import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Trip } from '$lib/api/trips';

const createTrip = vi.fn<(input: unknown) => Promise<Trip>>();
const listTrips = vi.fn<() => Promise<Trip[]>>();
vi.mock('$lib/api/trips', () => ({
  createTrip: (input: unknown) => createTrip(input),
  listTrips: () => listTrips(),
}));

const { tripsState } = await import('./trips.svelte');

describe('tripsState.save', () => {
  beforeEach(() => {
    createTrip.mockReset();
    tripsState.error = null;
    tripsState.trips = [];
  });

  it('reports success and clears any previous error', async () => {
    createTrip.mockResolvedValue({ id: 't1', origin: 1, destination: 2, label: 'Home to work' });

    const ok = await tripsState.save(1, 2, 'Home to work');

    expect(ok).toBe(true);
    expect(tripsState.saving).toBe(false);
    expect(tripsState.error).toBeNull();
    expect(createTrip).toHaveBeenCalledWith({ origin: 1, destination: 2, label: 'Home to work' });
    expect(tripsState.trips).toEqual([
      { id: 't1', origin: 1, destination: 2, label: 'Home to work' },
    ]);
  });

  it('surfaces an error and reports failure when the request rejects', async () => {
    createTrip.mockRejectedValue(new Error('network down'));

    const ok = await tripsState.save(1, 2, 'Home to work');

    expect(ok).toBe(false);
    expect(tripsState.saving).toBe(false);
    expect(tripsState.error).toBe('Could not save this trip.');
  });
});

describe('tripsState.load', () => {
  beforeEach(() => {
    listTrips.mockReset();
    tripsState.trips = [];
    tripsState.loaded = false;
  });

  it('populates the trip list and marks it loaded', async () => {
    const trips = [{ id: 't1', origin: 1, destination: 2, label: 'Home to work' }];
    listTrips.mockResolvedValue(trips);

    await tripsState.load();

    expect(tripsState.trips).toEqual(trips);
    expect(tripsState.loaded).toBe(true);
  });

  it('falls back to an empty list when the request rejects', async () => {
    listTrips.mockRejectedValue(new Error('network down'));

    await tripsState.load();

    expect(tripsState.trips).toEqual([]);
    expect(tripsState.loaded).toBe(true);
  });
});
