/**
 * Smou is the city's own mobility app, and the only place a Bicing bike can
 * actually be unlocked — this map can find one but not release it.
 */
export const SMOU_APP_STORE_URL =
  'https://apps.apple.com/es/app/smou-servicios-de-movilidad/id1439898721';
export const SMOU_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=cat.bcn.smoubcn&hl=es';

/**
 * Smou publishes no URL scheme and no assetlinks.json, so this names the
 * package's launcher activity instead. Where the browser cannot launch it —
 * not installed, or a browser that will not start a non-browsable activity —
 * it falls back to the Play page, which itself offers "Open" when installed.
 */
export const SMOU_ANDROID_INTENT_URL =
  'intent://#Intent;action=android.intent.action.MAIN;' +
  'category=android.intent.category.LAUNCHER;package=cat.bcn.smoubcn;' +
  `S.browser_fallback_url=${encodeURIComponent(SMOU_PLAY_STORE_URL)};end`;

/**
 * Android gets the intent; everything else gets the App Store, which covers iOS
 * and iPadOS (whose Mac-like user agent would defeat a positive iOS test) and
 * is as readable a landing page as Play on a desktop. iOS has no equivalent:
 * without a published scheme or universal link, Safari cannot reach the app.
 */
export function smouUrl(userAgent: string): string {
  return /Android/i.test(userAgent) ? SMOU_ANDROID_INTENT_URL : SMOU_APP_STORE_URL;
}
