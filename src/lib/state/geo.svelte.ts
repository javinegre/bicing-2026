import type { Coordinates } from '$lib/domain/types';

/** A session is a deliberate act, not a background mode — it expires on its own. */
const SESSION_MS = 30 * 60_000;
const FIX_INTERVAL_MS = 30_000;
const TICK_MS = 1_000;

/**
 * `maximumAge: 0` is load-bearing: anything else lets the UA answer a 30 s
 * poll from the same cached fix every time, and the marker never moves.
 *
 * A future change could swap the poll for `watchPosition`, which pushes on
 * real movement instead of on a clock — smoother, at the cost of keeping the
 * GPS session warm for the full 30 minutes.
 */
const TRACKING_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 0,
};

/**
 * Where the device is. Deliberately *not* part of the synced user config: a
 * location is a fact about this phone right now, and pushing it to the account
 * would drag a desktop session to wherever the phone last was. It is not
 * persisted at all — a fix outlives neither the session nor the page.
 */
class GeoState {
  position = $state<Coordinates | null>(null);
  status = $state<'idle' | 'locating' | 'denied'>('idle');
  tracking = $state(false);
  /** 1 at the start of a session, 0 at expiry — drives the draining ring. */
  remaining = $state(0);
  /** Whether the map still recentres on each fix; the first map gesture ends it. */
  following = $state(false);

  #timer: ReturnType<typeof setInterval> | null = null;
  #startedAt = 0;
  #lastFixAt = 0;
  #inFlight = false;

  start(): void {
    if (this.tracking) return;
    if (!('geolocation' in navigator)) {
      this.status = 'denied';
      return;
    }

    this.tracking = true;
    this.following = true;
    this.#startedAt = Date.now();
    this.#lastFixAt = this.#startedAt;
    this.remaining = 1;
    this.#requestFix();
    this.#timer = setInterval(() => this.#tick(), TICK_MS);
  }

  stop(): void {
    if (this.#timer !== null) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.tracking = false;
    this.following = false;
    this.remaining = 0;
    if (this.status === 'locating') this.status = 'idle';
  }

  /**
   * Three outcomes, not two: a session whose follow lock the user broke by
   * panning is resumed rather than ended, so the one control both recentres
   * and stops without needing a second button.
   */
  toggle(): void {
    if (!this.tracking) this.start();
    else if (this.following) this.stop();
    else this.following = true;
  }

  stopFollowing(): void {
    this.following = false;
  }

  /**
   * Elapsed comes from the wall clock rather than a tick count: background
   * tabs throttle intervals to roughly one a minute, so counting ticks would
   * stretch a 30-minute session indefinitely.
   */
  #tick(): void {
    const elapsed = Date.now() - this.#startedAt;
    if (elapsed >= SESSION_MS) {
      this.remaining = 0;
      this.stop();
      return;
    }

    this.remaining = 1 - elapsed / SESSION_MS;
    if (Date.now() - this.#lastFixAt >= FIX_INTERVAL_MS) this.#requestFix();
  }

  /**
   * `#inFlight` guards against pile-up: the 10 s timeout does not start while
   * the permission prompt is open, so the opening request can stay pending for
   * as long as the user ignores it.
   */
  #requestFix(): void {
    if (this.#inFlight) return;
    this.#inFlight = true;
    this.#lastFixAt = Date.now();
    if (!this.position) this.status = 'locating';

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.#inFlight = false;
        this.position = { lat: coords.latitude, lng: coords.longitude };
        this.status = 'idle';
      },
      (error) => {
        this.#inFlight = false;
        // Only a refusal is terminal. An unavailable or timed-out fix is
        // ordinary in a tunnel, so keep the last position and try again.
        if (error.code === error.PERMISSION_DENIED) {
          this.status = 'denied';
          this.stop();
        } else if (!this.position) {
          this.status = 'idle';
        }
      },
      TRACKING_OPTIONS,
    );
  }
}

export const geoState = new GeoState();
