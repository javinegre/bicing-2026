import { describe, expect, it } from 'vitest';
import { SMOU_ANDROID_INTENT_URL, SMOU_APP_STORE_URL, SMOU_PLAY_STORE_URL, smouUrl } from './smou';

describe('smouUrl', () => {
  it('sends Android to the app intent', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
    expect(smouUrl(ua)).toBe(SMOU_ANDROID_INTENT_URL);
  });

  it('sends iPhone to the App Store', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
    expect(smouUrl(ua)).toBe(SMOU_APP_STORE_URL);
  });

  it('sends an iPad posing as a Mac to the App Store', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    expect(smouUrl(ua)).toBe(SMOU_APP_STORE_URL);
  });
});

describe('SMOU_ANDROID_INTENT_URL', () => {
  it('falls back to the Play page, encoded so its query survives the intent', () => {
    const fallback = /S\.browser_fallback_url=([^;]+);end$/.exec(SMOU_ANDROID_INTENT_URL)?.[1];
    expect(fallback).not.toContain('&');
    expect(decodeURIComponent(fallback ?? '')).toBe(SMOU_PLAY_STORE_URL);
  });
});
