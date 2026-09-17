import { createTrip } from '$lib/api/trips';

/**
 * Saving a trip needs an account — there is no localStorage fallback like
 * bookmarks or saved stations have, since the trip has to be reachable from
 * any device to be worth saving. Callers gate the "Save trip" action on
 * `sessionState.signedIn` the same way the Saved tab itself is hidden signed
 * out; this class only owns the save request's in-flight/error state.
 */
class TripsState {
  saving = $state(false);
  error = $state<string | null>(null);

  async save(origin: number, destination: number, label: string): Promise<boolean> {
    this.saving = true;
    this.error = null;
    try {
      await createTrip({ origin, destination, label });
      return true;
    } catch {
      this.error = 'Could not save this trip.';
      return false;
    } finally {
      this.saving = false;
    }
  }
}

export const tripsState = new TripsState();
