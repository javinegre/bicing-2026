import type { Station } from '$lib/domain/types';

/**
 * Which half of the Plan screen is leading. `inactive` is not a third focus —
 * it means the plan is incomplete, and the split stays 50/50 with no swap
 * button and no Cancel.
 */
export type PlanMode = 'inactive' | 'origin' | 'destination';

/** Percentage of the split given to the top half in each mode. */
const TOP_GROW: Record<PlanMode, number> = { inactive: 50, origin: 65, destination: 35 };

class PlanState {
  origin = $state<Station | null>(null);
  destination = $state<Station | null>(null);
  mode = $state<PlanMode>('inactive');

  readonly complete = $derived(this.origin !== null && this.destination !== null);
  readonly active = $derived(this.mode !== 'inactive');
  readonly topGrow = $derived(TOP_GROW[this.mode]);

  /** A half-built plan has no leading side to show. */
  #settle(): void {
    if (!this.complete) this.mode = 'inactive';
    else if (this.mode === 'inactive') this.mode = 'origin';
  }

  /**
   * One button on a station row does both jobs: the first pick is the origin,
   * the second the destination. Once both are set the plan is full — the
   * caller greys the button out rather than silently replacing a leg.
   */
  canAdd(station: Station): boolean {
    return !this.complete && this.origin?.id !== station.id;
  }

  add(station: Station): void {
    if (!this.canAdd(station)) return;
    if (this.origin) this.destination = station;
    else this.origin = station;
    this.#settle();
  }

  setOrigin(station: Station | null): void {
    this.origin = station;
    this.#settle();
  }

  setDestination(station: Station | null): void {
    this.destination = station;
    this.#settle();
  }

  /** Cancel keeps the origin — you are usually still starting from the same place. */
  cancel(): void {
    this.destination = null;
    this.mode = 'inactive';
  }

  swap(): void {
    this.mode = this.mode === 'destination' ? 'origin' : 'destination';
  }

  focus(mode: Exclude<PlanMode, 'inactive'>): void {
    if (this.complete) this.mode = mode;
  }
}

export const planState = new PlanState();
