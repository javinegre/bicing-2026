<script lang="ts">
  import Icon from './Icon.svelte';
  import { getMarkerIconUrl } from '$lib/icons/marker-icon';
  import { loadGoogleMaps } from '$lib/map/google-maps';
  import { mapOptions } from '$lib/map/map-options';
  import { isNearby, LEG_NEARBY_RADIUS_M } from '$lib/domain/distance';
  import { stationColor } from '$lib/domain/station';
  import { mapState } from '$lib/state/map.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import type { Coordinates, ResourceType, Station } from '$lib/domain/types';

  interface Props {
    /** The leg's chosen station, or null while this leg is still being picked. */
    station: Station | null;
    resource: ResourceType;
    label: string;
    /** A marker other than the chosen station was tapped. */
    onPick: (station: Station) => void;
    /** The chosen station's own marker was tapped and its tooltip confirmed. */
    onOpenInMap: (station: Station) => void;
  }

  const { station, resource, label, onPick, onOpenInMap }: Props = $props();

  /** Fixed, not the app's default zoom: a leg preview, not a navigable map. */
  const ZOOM = 15;

  /**
   * Where an unchosen leg opens: the view the Map screen was left on, copied
   * once at mount rather than read reactively. `mapState.center` is rewritten
   * on every idle of that map, and following it would drag this preview around
   * underneath someone who is trying to pick from it.
   */
  const openingCenter: Coordinates = { ...mapState.center };

  let container = $state<HTMLDivElement | null>(null);
  let ready = $state(false);
  let tipOpen = $state(false);
  let map: google.maps.Map | null = null;

  /** Keyed by id so a 60 s status refresh recolours in place instead of
   *  recreating markers. Holds the chosen station's own large marker too. */
  const markers = new Map<number, google.maps.Marker>();

  /** What the shown catchment is measured from: the chosen station, or the
   *  opening view while this leg is still empty. */
  const anchor = $derived<Coordinates>(
    station ? { lat: station.lat, lng: station.lng } : openingCenter,
  );

  /**
   * Tapping the chosen station asks whether to open it on the Map screen; any
   * other marker picks that station for this leg. The live station is looked up
   * by id at tap time — the one captured when the marker was built carries
   * whatever counts were current then.
   */
  function handleMarkerTap(id: number): void {
    const tapped = stationsState.byId(id);
    if (!tapped) return;

    if (tapped.id === station?.id) {
      // Recentring first is what lets the tooltip sit at the container's centre
      // instead of projecting the marker's own pixel position.
      map?.panTo({ lat: tapped.lat, lng: tapped.lng });
      tipOpen = true;
      return;
    }

    tipOpen = false;
    onPick(tapped);
  }

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
          // Read inside the callback, which is outside the effect's tracking
          // scope: the map is built from wherever the leg stood at mount.
          center: station ? { lat: station.lat, lng: station.lng } : openingCenter,
          zoom: ZOOM,
          minZoom: ZOOM,
          maxZoom: ZOOM,
          scrollwheel: false,
          disableDoubleClickZoom: true,
        });
        map.addListener('dragstart', () => (tipOpen = false));
        map.addListener('click', () => (tipOpen = false));
        ready = true;
      })
      .catch(() => {
        // Silent: the leg's plain background stays visible underneath.
      });

    return () => {
      disposed = true;
      ready = false;
      for (const marker of markers.values()) marker.setMap(null);
      markers.clear();
      map = null;
    };
  });

  // Pans only when the chosen station itself changes — not on every status poll
  // below, which would otherwise fight a pan the person just made.
  $effect(() => {
    if (!ready || !map || !station) return;
    map.panTo({ lat: station.lat, lng: station.lng });
  });

  // Reconciles the chosen station's own marker plus everything within a 10 min
  // walk of the anchor, re-running on the station, its live counts, the shown
  // resource, and the bike-type filter — without touching the map's centre.
  $effect(() => {
    if (!ready || !map) return;
    const currentMap = map;
    const filter = prefsState.bikeTypeFilter;
    const center = anchor;
    const chosenId = station?.id ?? null;

    const seen = new Set<number>();
    for (const nearby of stationsState.all) {
      const chosen = nearby.id === chosenId;
      if (!chosen && !isNearby(nearby, center, LEG_NEARBY_RADIUS_M)) continue;
      seen.add(nearby.id);

      const icon = getMarkerIconUrl(
        resource,
        chosen ? 'l' : 's',
        stationColor(nearby, resource, filter),
      );
      const zIndex = chosen ? google.maps.Marker.MAX_ZINDEX + 1 : null;

      const existing = markers.get(nearby.id);
      if (existing) {
        existing.setIcon(icon);
        existing.setZIndex(zIndex);
        continue;
      }

      const marker = new google.maps.Marker({
        map: currentMap,
        position: { lat: nearby.lat, lng: nearby.lng },
        icon,
        title: nearby.name,
        zIndex,
      });
      marker.addListener('click', () => handleMarkerTap(nearby.id));
      markers.set(nearby.id, marker);
    }

    for (const [id, marker] of markers) {
      if (seen.has(id)) continue;
      marker.setMap(null);
      markers.delete(id);
    }
  });
</script>

<div class="leg-map" bind:this={container} role="application" aria-label={label}></div>

{#if tipOpen && station}
  <button
    type="button"
    class="leg-tip control-glass"
    onclick={() => {
      tipOpen = false;
      onOpenInMap(station);
    }}
  >
    <Icon name="tab-map" size={13} />
    Show on map
  </button>
{/if}

<style>
  .leg-map {
    position: absolute;
    inset: 0;
  }

  /* The chosen marker is recentred before this opens, so the container's
     centre is the marker — offset by the marker's own height plus a gap. */
  .leg-tip {
    position: absolute;
    left: 50%;
    bottom: calc(50% + 30px);
    transform: translateX(-50%);
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    white-space: nowrap;
    border-radius: 9999px;
    color: var(--color-ink);
    font-family: inherit;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
  }
</style>
