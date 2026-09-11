<script lang="ts">
  import { getMarkerIconUrl } from '$lib/icons/marker-icon';
  import { loadGoogleMaps } from '$lib/map/google-maps';
  import { mapOptions } from '$lib/map/map-options';
  import { isNearby } from '$lib/domain/distance';
  import { stationColor } from '$lib/domain/station';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import type { ResourceType, Station } from '$lib/domain/types';

  interface Props {
    station: Station;
    resource: ResourceType;
  }

  const { station, resource }: Props = $props();

  /** Fixed, not the app's default zoom: a leg preview, not a navigable map. */
  const ZOOM = 15;

  let container = $state<HTMLDivElement | null>(null);
  let ready = $state(false);
  let map: google.maps.Map | null = null;

  let mainMarker: google.maps.Marker | null = null;
  /** Everything within a 5 min walk of the selected station, keyed by id so a
   *  60 s status refresh recolours in place instead of recreating markers. */
  const nearbyMarkers = new Map<number, google.maps.Marker>();

  /**
   * Built once per mount, not once per station change — recreating the map on
   * every swap would reload tiles. `minZoom`/`maxZoom` pinned to `ZOOM` is what
   * actually blocks zoom (disableDefaultUI only hides the on-screen controls;
   * pinch and scroll gestures still work without this).
   */
  $effect(() => {
    const target = container;
    if (!target) return;

    let disposed = false;

    loadGoogleMaps()
      .then((maps) => {
        if (disposed) return;
        map = new maps.Map(target, {
          ...mapOptions,
          center: { lat: station.lat, lng: station.lng },
          zoom: ZOOM,
          minZoom: ZOOM,
          maxZoom: ZOOM,
          scrollwheel: false,
          disableDoubleClickZoom: true,
        });
        ready = true;
      })
      .catch(() => {
        // Silent: the leg's hatched background stays visible underneath.
      });

    return () => {
      disposed = true;
      ready = false;
      mainMarker?.setMap(null);
      mainMarker = null;
      for (const marker of nearbyMarkers.values()) marker.setMap(null);
      nearbyMarkers.clear();
      map = null;
    };
  });

  // Recentres only when the selected station itself changes — not on every
  // status poll below, which would otherwise fight a pan the person just made.
  $effect(() => {
    if (!ready || !map) return;
    map.setCenter({ lat: station.lat, lng: station.lng });
  });

  // Reconciles the selected station's own marker plus everything within a
  // 5 min walk of it, re-running on the station, its live counts, the shown
  // resource, and the bike-type filter — without touching the map's centre.
  $effect(() => {
    if (!ready || !map) return;
    const currentMap = map;
    const filter = prefsState.bikeTypeFilter;
    const position = { lat: station.lat, lng: station.lng };

    if (!mainMarker) {
      mainMarker = new google.maps.Marker({ map: currentMap, position });
    } else {
      mainMarker.setPosition(position);
    }
    mainMarker.setIcon(getMarkerIconUrl(resource, 'big', stationColor(station, resource, filter)));

    const seen = new Set<number>();
    for (const nearby of stationsState.all) {
      if (nearby.id === station.id) continue;
      if (!isNearby(nearby, station)) continue;
      seen.add(nearby.id);

      const icon = getMarkerIconUrl(resource, 'small', stationColor(nearby, resource, filter));
      const existing = nearbyMarkers.get(nearby.id);
      if (existing) {
        existing.setIcon(icon);
        continue;
      }

      nearbyMarkers.set(
        nearby.id,
        new google.maps.Marker({
          map: currentMap,
          position: { lat: nearby.lat, lng: nearby.lng },
          icon,
        }),
      );
    }

    for (const [id, marker] of nearbyMarkers) {
      if (seen.has(id)) continue;
      marker.setMap(null);
      nearbyMarkers.delete(id);
    }
  });
</script>

<div class="leg-map" bind:this={container} aria-hidden="true"></div>

<style>
  .leg-map {
    position: absolute;
    inset: 0;
  }
</style>
