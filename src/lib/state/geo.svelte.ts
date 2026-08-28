import type { Coordinates } from '$lib/domain/types';

const STORAGE_KEY = 'bicing2026:userLocation';

/** A two-hour-old fix is still worth centring on; older is misleading. */
const TTL_MS = 2 * 60 * 60 * 1000;

const GEO_OPTIONS: PositionOptions = { timeout: 10_000, maximumAge: 30_000 };

interface StoredFix {
  position: Coordinates;
  at: number;
}

/**
 * Where the device is. Deliberately *not* part of the synced user config: a
 * location is a fact about this phone right now, and pushing it to the account
 * would drag a desktop session to wherever the phone last was.
 */
class GeoState {
  position = $state<Coordinates | null>(null);
  status = $state<'idle' | 'locating' | 'denied'>('idle');

  restore(): void {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const fix = JSON.parse(raw) as StoredFix;
      if (Date.now() - fix.at < TTL_MS) this.position = fix.position;
    } catch {
      // Corrupt entry: behave as if we had never located the device.
    }
  }

  locate(): Promise<Coordinates | null> {
    if (!('geolocation' in navigator)) {
      this.status = 'denied';
      return Promise.resolve(null);
    }

    this.status = 'locating';
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const position = { lat: coords.latitude, lng: coords.longitude };
          this.position = position;
          this.status = 'idle';
          try {
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ position, at: Date.now() } satisfies StoredFix),
            );
          } catch {
            // Nothing to do; the in-memory fix still works for this session.
          }
          resolve(position);
        },
        () => {
          this.status = 'denied';
          resolve(null);
        },
        GEO_OPTIONS,
      );
    });
  }
}

export const geoState = new GeoState();
