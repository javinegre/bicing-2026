import { beforeEach, describe, expect, it } from 'vitest';
import { planState } from './plan.svelte';
import type { Station } from '$lib/domain/types';

const station = (id: number, name: string): Station => ({
  id,
  name,
  lat: 41.39,
  lng: 2.16,
  mechanical: 5,
  electrical: 2,
  docks: 8,
  status: 1,
});

const rossello = station(1, 'Rosselló, 178');
const llull = station(2, 'Llull, 128');

describe('planState', () => {
  beforeEach(() => {
    planState.setOrigin(null);
    planState.setDestination(null);
  });

  it('starts inactive with an even split', () => {
    expect(planState.active).toBe(false);
    expect(planState.topGrow).toBe(50);
  });

  // `$state` wraps objects in a proxy, so a stored station is never identical
  // to the one that went in — compare by value, not by reference.
  it('fills origin then destination from one action', () => {
    planState.add(rossello);
    expect(planState.origin).toEqual(rossello);
    expect(planState.active).toBe(false);

    planState.add(llull);
    expect(planState.destination).toEqual(llull);
    expect(planState.complete).toBe(true);
    expect(planState.mode).toBe('origin');
    expect(planState.topGrow).toBe(65);
  });

  it('refuses to add a station that is already the origin', () => {
    planState.add(rossello);
    expect(planState.canAdd(rossello)).toBe(false);
    planState.add(rossello);
    expect(planState.destination).toBeNull();
  });

  it('refuses to add once the plan is full', () => {
    planState.add(rossello);
    planState.add(llull);
    expect(planState.canAdd(station(3, 'Marina, 236'))).toBe(false);
  });

  it('swaps which leg leads', () => {
    planState.add(rossello);
    planState.add(llull);
    planState.swap();
    expect(planState.mode).toBe('destination');
    expect(planState.topGrow).toBe(35);
  });

  it('cancel keeps the origin and drops back to the even split', () => {
    planState.add(rossello);
    planState.add(llull);
    planState.cancel();
    expect(planState.origin).toEqual(rossello);
    expect(planState.destination).toBeNull();
    expect(planState.topGrow).toBe(50);
  });

  it('ignores focus while the plan is incomplete', () => {
    planState.add(rossello);
    planState.focus('destination');
    expect(planState.mode).toBe('inactive');
  });
});
