<script lang="ts">
  import { untrack } from 'svelte';
  import myLocationSvg from '$lib/icons/hints/my-location.svg?raw';
  import { getMarkerIconUrl } from '$lib/icons/marker-icon';
  import { loadGoogleMaps } from '$lib/map/google-maps';
  import { DEFAULT_ZOOM, mapOptions, markerSizeForZoom } from '$lib/map/map-options';
  import { stationColor } from '$lib/domain/station';
  import { geoState } from '$lib/state/geo.svelte';
  import { mapState } from '$lib/state/map.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import { uiState } from '$lib/state/ui.svelte';

  /** Static, unlike the resource markers — built once rather than per render. */
  const USER_LOCATION_ICON = `data:image/svg+xml,${encodeURIComponent(myLocationSvg)}`;

  let container = $state<HTMLDivElement | null>(null);

  /**
   * Markers are the one place this app is imperative. Google owns their
   * lifetime, so they live in a plain Map outside the reactive graph and are
   * reconciled by id; recreating ~500 of them on every 60 s refresh would drop
   * frames and lose click state.
   */
  const markers = new Map<number, google.maps.Marker>();

  let userMarker: google.maps.Marker | null = null;
  /** The zoom bump belongs to the session opening, not to every fix in it. */
  let zoomedThisSession = false;

  const breakFollow = () => geoState.stopFollowing();

  const size = $derived(markerSizeForZoom(mapState.zoom));

  $effect(() => {
    const target = container;
    if (!target) return;

    let disposed = false;

    /**
     * Any touch of the map ends the follow lock. Listening on the container in
     * the capture phase rather than on Google's `dragstart` catches the gestures
     * that never drag — wheel and double-tap zoom, a pinch that only scales, a
     * marker tap whose `centerOnMarker` would otherwise fight the next follow
     * pan — and, unlike a Maps event, cannot be swallowed before we see it.
     * Programmatic `panTo`/`panBy`/`setZoom` raise neither, so our own pans are
     * safe, and MapControls is a sibling of this component, so the FAB is not
     * inside `target`.
     */
    target.addEventListener('pointerdown', breakFollow, { capture: true });
    target.addEventListener('wheel', breakFollow, { capture: true, passive: true });

    loadGoogleMaps()
      .then((maps) => {
        if (disposed) return;
        const map = new maps.Map(target, {
          ...mapOptions,
          center: mapState.center,
          zoom: mapState.zoom,
        });

        // `idle` rather than `center_changed`: one event per gesture instead of
        // one per frame, which is also what the debounced config write wants.
        map.addListener('idle', () => {
          const center = map.getCenter();
          if (!center) return;
          mapState.syncFromMap({ lat: center.lat(), lng: center.lng() }, map.getZoom() ?? 15);
        });

        mapState.handler = map;
        mapState.ready = true;
        mapState.error = null;
      })
      .catch((err: unknown) => {
        mapState.error = err instanceof Error ? err.message : 'Map failed to load';
      });

    return () => {
      disposed = true;
      target.removeEventListener('pointerdown', breakFollow, { capture: true });
      target.removeEventListener('wheel', breakFollow, { capture: true });
      for (const marker of markers.values()) marker.setMap(null);
      markers.clear();
      userMarker?.setMap(null);
      userMarker = null;
      mapState.handler = null;
      mapState.ready = false;
    };
  });

  // Re-runs whenever the station data, the shown resource, the bike filter or
  // the marker size changes — each of which changes some markers' icons.
  // Also gated on `mapState.ready` (rather than reading `handler` alone):
  // `handler` is a plain, non-reactive property, so assigning it in the
  // effect above never re-triggers this one on its own.
  $effect(() => {
    if (!mapState.ready) return;
    const map = mapState.handler;
    if (!map) return;

    const resource = prefsState.resourceShown;
    const filter = prefsState.bikeTypeFilter;
    const currentSize = size;
    const seen = new Set<number>();

    for (const station of stationsState.all) {
      seen.add(station.id);
      const icon = getMarkerIconUrl(resource, currentSize, stationColor(station, resource, filter));

      const existing = markers.get(station.id);
      if (existing) {
        existing.setIcon(icon);
        continue;
      }

      const marker = new google.maps.Marker({
        map,
        position: { lat: station.lat, lng: station.lng },
        icon,
        title: station.name,
      });
      marker.addListener('click', () => {
        uiState.select(station.id);
        mapState.centerOnMarker({ lat: station.lat, lng: station.lng });
      });
      markers.set(station.id, marker);
    }

    for (const [id, marker] of markers) {
      if (seen.has(id)) continue;
      marker.setMap(null);
      markers.delete(id);
    }
  });

  /**
   * The device's own fix, separate from the ~500 station markers above. It
   * exists only for the length of a tracking session and moves every 30 s
   * within one, so the instance is kept and repositioned rather than rebuilt.
   */
  $effect(() => {
    if (!mapState.ready) return;
    const map = mapState.handler;
    const position = geoState.tracking ? geoState.position : null;

    if (!map || !position) {
      userMarker?.setMap(null);
      userMarker = null;
      return;
    }

    if (userMarker) {
      userMarker.setPosition(position);
      return;
    }

    userMarker = new google.maps.Marker({
      map,
      position,
      icon: { url: USER_LOCATION_ICON, anchor: new google.maps.Point(12, 12) },
      clickable: false,
      zIndex: google.maps.Marker.MAX_ZINDEX + 1,
    });
  });

  /**
   * Keeps the followed view off the config: those pans are ours, not the user's.
   */
  $effect(() => {
    mapState.persistView = !geoState.following;
  });

  /**
   * Follows the fix until the user touches the map. Everything past the reads
   * is untracked because `syncFromMap` hands `mapState.center` a fresh object
   * on every idle — an effect that both read it and panned would re-trigger
   * itself forever.
   */
  $effect(() => {
    if (!geoState.tracking) {
      zoomedThisSession = false;
      return;
    }

    const position = geoState.position;
    if (!mapState.ready || !geoState.following || !position) return;

    untrack(() => {
      // Only the opening fix may zoom; repeating it would undo a manual
      // zoom-out every 30 s.
      if (zoomedThisSession) {
        mapState.panTo(position);
      } else {
        mapState.panTo(position, Math.max(mapState.zoom, DEFAULT_ZOOM));
        zoomedThisSession = true;
      }
      // panTo is an absolute re-centre, which undoes any lift an open detail
      // sheet had already applied (same reasoning as centerOnMarker).
      if (uiState.sheetOpen) mapState.liftForSheet();
    });
  });
</script>

<div class="canvas" bind:this={container} role="application" aria-label="Bicing station map"></div>

{#if mapState.error}
  <div class="map-error">
    <p>{mapState.error}</p>
    <p class="hint">
      Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code> to load tiles.
    </p>
  </div>
{/if}

<style>
  .canvas {
    position: absolute;
    inset: 0;
    background: #f4f4f4;
  }

  .map-error {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px;
    text-align: center;
    background: var(--color-canvas);
    color: var(--color-ink-secondary);
    font-size: 14px;
  }

  .hint {
    color: var(--color-ink-label);
    font-size: 12.5px;
  }

  code {
    font-family: var(--font-mono);
  }
</style>
