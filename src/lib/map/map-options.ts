import type { Coordinates } from '$lib/domain/types';

/** The same default the 2023 app opens on, near Passeig de Gràcia. */
export const DEFAULT_CENTER: Coordinates = { lat: 41.38694482, lng: 2.17017464 };
export const DEFAULT_ZOOM = 15;

export const MIN_ZOOM = 13;
export const MAX_ZOOM = 18;

/** Below this, markers switch to the smaller template — 500 big pins is mush. */
export const MARKER_SIZE_ZOOM_THRESHOLD = 14;

/**
 * A muted, label-light basemap: the markers carry all the colour, so the map
 * underneath is reduced to roads (white), water (#c2d8f2) and parks (#e2f0d8).
 * These are the exact values the design's mock map reproduces.
 */
const styles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'geometry.fill', stylers: [{ color: '#f4f4f4' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#c0c0c0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#e2f0d8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c0c0c0' }],
  },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#c2d8f2' }] },
];

export const mapOptions: google.maps.MapOptions = {
  // "greedy" so a one-finger drag pans instead of scrolling the page — the map
  // fills the screen, there is nothing behind it to scroll.
  gestureHandling: 'greedy',
  disableDefaultUI: true,
  clickableIcons: false,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  styles,
};
