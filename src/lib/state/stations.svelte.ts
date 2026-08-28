import { fetchStationInfo, fetchStationStatus } from '$lib/api/stations';
import { mergeStations } from '$lib/domain/station';
import type { Station, StationInfo, StationStatus } from '$lib/domain/types';

/** Upstream caches status for 60 s, so polling faster only burns battery. */
const REFRESH_MS = 60_000;

class StationsState {
  info = $state<StationInfo[]>([]);
  status = $state<StationStatus[]>([]);
  /** Unix seconds, straight from the upstream feed — not our fetch time. */
  lastUpdated = $state<number | null>(null);
  error = $state<string | null>(null);
  loading = $state(false);

  readonly all = $derived(mergeStations(this.info, this.status));

  #timer: ReturnType<typeof setInterval> | null = null;

  byId(id: number): Station | undefined {
    return this.all.find((s) => s.id === id);
  }

  /** Info changes rarely (10 min cache upstream); status is what needs polling. */
  async load(): Promise<void> {
    this.loading = true;
    try {
      const [info, status] = await Promise.all([
        this.info.length ? Promise.resolve(this.info) : fetchStationInfo(),
        fetchStationStatus(),
      ]);
      this.info = info;
      this.status = status.stations;
      this.lastUpdated = status.lastUpdated;
      this.error = null;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Could not reach the Bicing API';
    } finally {
      this.loading = false;
    }
  }

  start(): void {
    if (this.#timer !== null) return;
    void this.load();
    this.#timer = setInterval(() => void this.load(), REFRESH_MS);
  }

  stop(): void {
    if (this.#timer === null) return;
    clearInterval(this.#timer);
    this.#timer = null;
  }
}

export const stationsState = new StationsState();
