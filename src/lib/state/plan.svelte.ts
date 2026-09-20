import type { Station } from '$lib/domain/types';

export type PlanLeg = 'origin' | 'destination';

/**
 * Which half of the Plan screen the person last focused. `inactive` is not a
 * third focus — it means the plan is incomplete, so there is no swap button
 * and no Cancel, and `leading` decides the split instead.
 */
export type PlanMode = 'inactive' | PlanLeg;

/** How far the plan has got, independent of which leg leads. */
export type PlanStage = 'idle' | 'planning' | 'planned';

/** Percentage of the split given to the top half for each leading leg. */
const TOP_GROW: Record<PlanLeg, number> = { origin: 65, destination: 35 };

class PlanState {
  origin = $state<Station | null>(null);
  destination = $state<Station | null>(null);
  mode = $state<PlanMode>('inactive');

  readonly complete = $derived(this.origin !== null && this.destination !== null);
  readonly active = $derived(this.mode !== 'inactive');

  readonly stage = $derived<PlanStage>(
    this.complete
      ? 'planned'
      : this.origin === null && this.destination === null
        ? 'idle'
        : 'planning',
  );

  /**
   * Which leg gets the larger half. Until the plan is full that is whichever
   * leg is still being chosen — the map you are picking from deserves the
   * space. Once both are set it follows the focus the person picked.
   */
  readonly leading = $derived<PlanLeg>(
    this.complete
      ? this.mode === 'destination'
        ? 'destination'
        : 'origin'
      : this.origin === null
        ? 'origin'
        : 'destination',
  );

  readonly topGrow = $derived(TOP_GROW[this.leading]);

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

  cancel(): void {
    this.origin = null;
    this.destination = null;
    this.mode = 'inactive';
  }

  swap(): void {
    this.mode = this.mode === 'destination' ? 'origin' : 'destination';
  }

  focus(mode: PlanLeg): void {
    if (this.complete) this.mode = mode;
  }
}

export const planState = new PlanState();
