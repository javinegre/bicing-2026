<script lang="ts">
  import { getMarkerIconUrl } from '$lib/icons/marker-icon';
  import { loadGoogleMaps } from '$lib/map/google-maps';
  import { mapOptions } from '$lib/map/map-options';
  import { stationColor } from '$lib/domain/station';
  import { prefsState } from '$lib/state/prefs.svelte';
  import type { ResourceType, Station } from '$lib/domain/types';

  interface Props {
    station: Station;
    resource: ResourceType;
  }

  const { station, resource }: Props = $props();

  /** Fixed, not the app's default zoom: a leg preview, not a navigable map. */
  const ZOOM = 15;

  let container = $state<HTMLDivElement | null>(null);
  let map: google.maps.Map | null = null;
  let marker: google.maps.Marker | null = null;

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
        marker = new maps.Marker({
          map,
          position: { lat: station.lat, lng: station.lng },
          icon: getMarkerIconUrl(
            resource,
            'big',
            stationColor(station, resource, prefsState.bikeTypeFilter),
          ),
        });
      })
      .catch(() => {
        // Silent: the leg's hatched background stays visible underneath.
      });

    return () => {
      disposed = true;
      marker?.setMap(null);
      marker = null;
      map = null;
    };
  });

  // Reposition and recolour in place when the station, its live counts, or
  // the shown resource changes, instead of tearing the map down.
  $effect(() => {
    if (!map || !marker) return;
    const position = { lat: station.lat, lng: station.lng };
    marker.setPosition(position);
    marker.setIcon(
      getMarkerIconUrl(resource, 'big', stationColor(station, resource, prefsState.bikeTypeFilter)),
    );
    map.setCenter(position);
  });
</script>

<div class="leg-map" bind:this={container} aria-hidden="true"></div>

<style>
  .leg-map {
    position: absolute;
    inset: 0;
  }
</style>
