<script lang="ts">
  import Icon from './Icon.svelte';
  import ResourceSwitch from './ResourceSwitch.svelte';
  import { DEFAULT_ZOOM } from '$lib/map/map-options';
  import { geoState } from '$lib/state/geo.svelte';
  import { mapState } from '$lib/state/map.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import type { BookmarkType } from '$lib/domain/types';
  import type { IconName } from '$lib/icons';

  const BOOKMARKS: { type: BookmarkType; icon: IconName; label: string }[] = [
    { type: 'home', icon: 'home', label: 'Home' },
    { type: 'work', icon: 'briefcase', label: 'Work' },
    { type: 'favorite', icon: 'star', label: 'Favorite' },
  ];

  async function locate() {
    const position = await geoState.locate();
    if (position) mapState.panTo(position, Math.max(mapState.zoom, DEFAULT_ZOOM));
  }

  /**
   * One control, two jobs: jump to a bookmark that exists, or set one from the
   * current centre if it doesn't. Long-press would be invisible; a tap on an
   * unset bookmark is the only affordance there is room for.
   */
  function useBookmark(type: BookmarkType) {
    const saved = prefsState.bookmarks[type];
    if (saved) mapState.panTo(saved);
    else prefsState.setBookmark(type, mapState.center);
  }
</script>

<div class="stack top">
  <ResourceSwitch />
</div>

<div class="stack side">
  <button type="button" class="fab gradient-accent" onclick={locate} aria-label="My location">
    <Icon name="user-location" size={21} />
  </button>

  <div class="group control-glass">
    <button type="button" onclick={() => mapState.zoomBy(1)} aria-label="Zoom in">
      <Icon name="zoom-in" size={15} />
    </button>
    <div class="rule"></div>
    <button type="button" onclick={() => mapState.zoomBy(-1)} aria-label="Zoom out">
      <Icon name="zoom-out" size={15} />
    </button>
  </div>

  <div class="group control-glass">
    {#each BOOKMARKS as bookmark, i (bookmark.type)}
      {#if i > 0}<div class="rule"></div>{/if}
      <button
        type="button"
        class:unset={!prefsState.bookmarks[bookmark.type]}
        onclick={() => useBookmark(bookmark.type)}
        aria-label={prefsState.bookmarks[bookmark.type]
          ? `Go to ${bookmark.label}`
          : `Set ${bookmark.label} here`}
      >
        <Icon name={bookmark.icon} size={14} />
      </button>
    {/each}
  </div>
</div>

<style>
  .stack {
    position: absolute;
    right: 12px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .top {
    top: 84px;
    align-items: flex-end;
  }

  .side {
    top: 150px;
    align-items: center;
  }

  .fab {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: var(--radius-surface);
    box-shadow: var(--shadow-control);
    color: var(--color-ink);
    cursor: pointer;
  }

  .group {
    width: 44px;
    border-radius: var(--radius-surface);
    overflow: hidden;
  }

  .group button {
    width: 100%;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 0;
    color: var(--color-ink);
    cursor: pointer;
  }

  .group button.unset {
    opacity: 0.4;
  }

  .rule {
    height: 1px;
    background: var(--color-hairline);
  }
</style>
