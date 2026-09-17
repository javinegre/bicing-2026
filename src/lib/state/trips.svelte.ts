import { createTrip, listTrips, type Trip } from '$lib/api/trips';

/**
 * Saving a trip needs an account — there is no localStorage fallback like
 * bookmarks or saved stations have, since the trip has to be reachable from
 * any device to be worth saving. Callers gate the "Save trip" action on
 * `sessionState.signedIn` the same way the Saved tab itself is hidden signed
 * out; this class owns the save request's in-flight/error state plus the
 * loaded list the Saved tab renders.
 */
class TripsState {
  saving = $state(false);
  error = $state<string | null>(null);
  trips = $state<Trip[]>([]);
  loaded = $state(false);

  async save(origin: number, destination: number, label: string): Promise<boolean> {
    this.saving = true;
    this.error = null;
    try {
      const trip = await createTrip({ origin, destination, label });
      this.trips = [...this.trips, trip];
      return true;
    } catch {
      this.error = 'Could not save this trip.';
      return false;
    } finally {
      this.saving = false;
    }
  }

  /** Re-fetched each time the Saved tab mounts, so another device's edits show up. */
  async load(): Promise<void> {
    try {
      this.trips = await listTrips();
    } catch {
      this.trips = [];
    } finally {
      this.loaded = true;
    }
  }
}

export const tripsState = new TripsState();
