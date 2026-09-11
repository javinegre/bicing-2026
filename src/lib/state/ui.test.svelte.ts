import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uiState } from './ui.svelte';

describe('uiState routing', () => {
  const pushSpy = vi.spyOn(history, 'pushState');
  const replaceSpy = vi.spyOn(history, 'replaceState');

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    uiState.syncFromLocation();
    pushSpy.mockClear();
    replaceSpy.mockClear();
  });

  it('go pushes history and updates the tab', () => {
    uiState.go('plan');

    expect(uiState.tab).toBe('plan');
    expect(pushSpy).toHaveBeenCalledOnce();
    expect(pushSpy.mock.calls[0]![2]).toBe('/plan');
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('go no-ops on the already-active tab', () => {
    uiState.go('map');

    expect(pushSpy).not.toHaveBeenCalled();
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('setSearchQuery replaces history while on the search tab', () => {
    uiState.go('search');
    pushSpy.mockClear();

    uiState.setSearchQuery('a');

    expect(uiState.searchQuery).toBe('a');
    expect(replaceSpy).toHaveBeenCalledOnce();
    expect(replaceSpy.mock.calls[0]![2]).toBe('/search?query=a');
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('setSearchQuery updates state but writes no history off the search tab', () => {
    uiState.setSearchQuery('a');

    expect(uiState.searchQuery).toBe('a');
    expect(pushSpy).not.toHaveBeenCalled();
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('syncFromLocation mirrors the URL without writing history', () => {
    window.history.pushState(null, '', '/saved');

    uiState.syncFromLocation();

    expect(uiState.tab).toBe('saved');
    expect(pushSpy).toHaveBeenCalledOnce(); // only the manual pushState above
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('redirectToMap replaces history rather than pushing', () => {
    uiState.go('plan');
    pushSpy.mockClear();

    uiState.redirectToMap();

    expect(uiState.tab).toBe('map');
    expect(replaceSpy).toHaveBeenCalledOnce();
    expect(pushSpy).not.toHaveBeenCalled();
  });
});
