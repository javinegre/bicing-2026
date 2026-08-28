/**
 * Loads the Google Maps JS API on demand.
 *
 * This is the app's one hard external dependency: it needs a Google Cloud
 * project and a browser API key (VITE_GOOGLE_MAPS_API_KEY). The 2023 app used
 * the same vendor and the design's map styling is a Google Maps style array, so
 * this is continuity rather than a new commitment — but it is a commitment.
 */
const SCRIPT_ID = 'google-maps-js';

let loader: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (loader) return loader;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    loader = Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
    return loader;
  }

  loader = new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.maps) {
      resolve(google.maps);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      '&loading=async&v=weekly';
    script.addEventListener('load', () => resolve(google.maps), { once: true });
    script.addEventListener('error', () => reject(new Error('Google Maps failed to load')), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return loader;
}
