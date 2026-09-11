import { DEFAULT_CENTER, DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from '$lib/map/map-options';
import { prefsState } from './prefs.svelte';
import type { Coordinates } from '$lib/domain/types';

/**
 * The map's viewport, mirrored out of the imperative Google Maps instance so
 * the rest of the UI (nearby totals, distances, the closest-stations list) can
 * be plain derived state instead of listening to map events itself.
 */
class MapState {
  center = $state<Coordinates>(DEFAULT_CENTER);
  zoom = $state<number>(DEFAULT_ZOOM);
  ready = $state(false);
  error = $state<string | null>(null);

  /** Set by MapCanvas once Google hands us an instance; null everywhere else. */
  handler: google.maps.Map | null = null;

  /** Restore the last view the user left, from whichever backend prefs loaded. */
  restore(): void {
    if (prefsState.mapCenter) this.center = prefsState.mapCenter;
    if (prefsState.mapZoom) this.zoom = prefsState.mapZoom;
  }

  /** Called from the map's own idle event — persists, does not re-pan the map. */
  syncFromMap(center: Coordinates, zoom: number): void {
    this.center = center;
    this.zoom = zoom;
    prefsState.setMapView(center, zoom);
  }

  /** Called from the UI — moves the map, which then echoes back via syncFromMap. */
  panTo(center: Coordinates, zoom?: number): void {
    this.center = center;
    if (zoom !== undefined) this.zoom = zoom;
    this.handler?.panTo(center);
    if (zoom !== undefined) this.handler?.setZoom(zoom);
  }

  /**
   * Centres on a station that was just selected (marker press or a row in
   * one of the station lists). Selecting also opens the detail sheet (up to
   * 54% of the map height), so the pin is lifted by a quarter of the map's
   * own height — mirroring the 2023 app's `setGMapsCenter` yOffset trick —
   * to land in the band that stays visible above the sheet, whether the map
   * was fully visible beforehand or the sheet was already open on a
   * different station. Reads the map's own div rather than taking the
   * height from the caller so every selection path can share one call.
   */
  centerOnMarker(coords: Coordinates): void {
    this.center = coords;
    this.handler?.panTo(coords);
    const liftPx = (this.handler?.getDiv().clientHeight ?? 0) / 4;
    if (liftPx) this.handler?.panBy(0, liftPx);
  }

  zoomBy(delta: number): void {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom + delta));
    this.zoom = next;
    this.handler?.setZoom(next);
  }
}

export const mapState = new MapState();
