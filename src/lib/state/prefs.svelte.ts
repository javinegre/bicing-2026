import { DEFAULT_CONFIG, fetchUserConfig, saveUserConfig } from '$lib/api/user-config';
import type { UserConfig } from '$lib/api/user-config';
import { sessionState } from './session.svelte';
import type { BikeTypeFilter, BookmarkType, Coordinates, ResourceType } from '$lib/domain/types';

const LOCAL_KEY = 'bicing2026:config';

/** Coalesce a map drag into one write instead of one per frame. */
const PERSIST_DEBOUNCE_MS = 800;

function readLocal(): UserConfig {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw
      ? { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<UserConfig>) }
      : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * User preferences, backed by the server when signed in and by localStorage
 * otherwise. Callers mutate the fields directly; persistence is a debounced
 * side effect, so nothing in the UI has to know which backend is in play.
 */
class PrefsState {
  mapCenter = $state<Coordinates | null>(DEFAULT_CONFIG.mapCenter);
  mapZoom = $state<number | null>(DEFAULT_CONFIG.mapZoom);
  resourceShown = $state<ResourceType>(DEFAULT_CONFIG.resourceShown);
  bikeTypeFilter = $state<BikeTypeFilter>(DEFAULT_CONFIG.bikeTypeFilter);
  bookmarks = $state({ ...DEFAULT_CONFIG.bookmarks });
  savedStationIds = $state<number[]>([]);

  /** Server writes can fail (offline, session expired); surface it, don't throw. */
  syncError = $state<string | null>(null);
  loaded = $state(false);

  #timer: ReturnType<typeof setTimeout> | null = null;
  #pending: Partial<UserConfig> = {};

  get snapshot(): UserConfig {
    return {
      mapCenter: this.mapCenter,
      mapZoom: this.mapZoom,
      resourceShown: this.resourceShown,
      bikeTypeFilter: this.bikeTypeFilter,
      bookmarks: { ...this.bookmarks },
      savedStationIds: [...this.savedStationIds],
    };
  }

  #apply(config: UserConfig): void {
    this.mapCenter = config.mapCenter;
    this.mapZoom = config.mapZoom;
    this.resourceShown = config.resourceShown;
    this.bikeTypeFilter = config.bikeTypeFilter;
    this.bookmarks = { ...config.bookmarks };
    this.savedStationIds = [...config.savedStationIds];
  }

  async load(): Promise<void> {
    if (sessionState.signedIn) {
      try {
        this.#apply(await fetchUserConfig());
        this.loaded = true;
        return;
      } catch {
        // Fall through to the device copy rather than resetting someone's
        // bookmarks because the API happened to be down.
        this.syncError = 'Could not load your saved settings; using this device’s copy.';
      }
    }
    this.#apply(readLocal());
    this.loaded = true;
  }

  /** Queue a partial write. Repeated calls within the debounce window merge. */
  #persist(patch: Partial<UserConfig>): void {
    Object.assign(this.#pending, patch);
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.flush(), PERSIST_DEBOUNCE_MS);
  }

  async flush(): Promise<void> {
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    const patch = this.#pending;
    this.#pending = {};
    if (Object.keys(patch).length === 0) return;

    if (!sessionState.signedIn) {
      try {
        window.localStorage.setItem(LOCAL_KEY, JSON.stringify(this.snapshot));
      } catch {
        // Private mode / quota: preferences just don't survive the tab.
      }
      return;
    }

    try {
      await saveUserConfig(patch);
      this.syncError = null;
    } catch {
      this.syncError = 'Your settings could not be saved to your account.';
    }
  }

  setMapView(center: Coordinates, zoom: number): void {
    this.mapCenter = center;
    this.mapZoom = zoom;
    this.#persist({ mapCenter: center, mapZoom: zoom });
  }

  setResourceShown(resource: ResourceType): void {
    this.resourceShown = resource;
    this.#persist({ resourceShown: resource });
  }

  /** Tapping the active filter clears it — "all bikes" is the unfiltered state. */
  toggleBikeTypeFilter(filter: NonNullable<BikeTypeFilter>): void {
    this.bikeTypeFilter = this.bikeTypeFilter === filter ? null : filter;
    this.#persist({ bikeTypeFilter: this.bikeTypeFilter });
  }

  setBookmark(type: BookmarkType, position: Coordinates | null): void {
    this.bookmarks = { ...this.bookmarks, [type]: position };
    this.#persist({ bookmarks: this.bookmarks });
  }

  isSaved(stationId: number): boolean {
    return this.savedStationIds.includes(stationId);
  }

  toggleSavedStation(stationId: number): void {
    this.savedStationIds = this.isSaved(stationId)
      ? this.savedStationIds.filter((id) => id !== stationId)
      : [...this.savedStationIds, stationId];
    this.#persist({ savedStationIds: this.savedStationIds });
  }

  /**
   * Signing in adopts whatever the device had, so a first sign-in doesn't look
   * like the app forgot everything. Signing out leaves the server copy alone.
   */
  async onSignIn(): Promise<void> {
    const local = readLocal();
    await this.load();
    const serverIsEmpty =
      !this.mapCenter && this.savedStationIds.length === 0 && !this.bookmarks.home;
    if (serverIsEmpty) {
      this.#apply(local);
      this.#persist(this.snapshot);
      await this.flush();
    }
  }
}

export const prefsState = new PrefsState();
