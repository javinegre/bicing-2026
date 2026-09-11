<script lang="ts">
  import { getMarkerIconUrl } from '$lib/icons/marker-icon';
  import { loadGoogleMaps } from '$lib/map/google-maps';
  import { MARKER_SIZE_ZOOM_THRESHOLD, mapOptions } from '$lib/map/map-options';
  import { stationColor } from '$lib/domain/station';
  import { mapState } from '$lib/state/map.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import { uiState } from '$lib/state/ui.svelte';

  let container = $state<HTMLDivElement | null>(null);

  /**
   * Markers are the one place this app is imperative. Google owns their
   * lifetime, so they live in a plain Map outside the reactive graph and are
   * reconciled by id; recreating ~500 of them on every 60 s refresh would drop
   * frames and lose click state.
   */
  const markers = new Map<number, google.maps.Marker>();

  const size = $derived(mapState.zoom >= MARKER_SIZE_ZOOM_THRESHOLD ? 'big' : 'small');

  $effect(() => {
    const target = container;
    if (!target) return;

    let disposed = false;

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
      for (const marker of markers.values()) marker.setMap(null);
      markers.clear();
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
