<script lang="ts">
  import Icon from './Icon.svelte';
  import ResourceSwitch from './ResourceSwitch.svelte';
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

  // The label carries what a press will do; `aria-pressed` only states whether
  // tracking is on, which stays true across a recentre.
  const locationLabel = $derived(
    !geoState.tracking
      ? 'My location'
      : geoState.following
        ? 'Stop tracking my location'
        : 'Recentre on my location',
  );

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
  <button
    type="button"
    class="fab gradient-accent"
    onclick={() => geoState.toggle()}
    aria-pressed={geoState.tracking}
    aria-label={locationLabel}
  >
    {#if geoState.tracking}
      <!-- `remaining` is already a turn, and it drains rather than fills. -->
      <div
        class="ring"
        style:background="conic-gradient(var(--color-ink) 0turn {geoState.remaining}turn,
        var(--color-accent-deep) {geoState.remaining}turn 1turn)"
      ></div>
      <div class="hub gradient-accent"></div>
    {/if}
    <span class="glyph" class:pulsing={geoState.following}>
      <Icon name="user-location" size={21} />
    </span>
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
    position: relative;
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

  /* Ring, hub and glyph are siblings rather than nested: opacity composites a
     whole subtree, so a dimmed ring wrapping the icon would cap how bright the
     icon could ever pulse. Absolute, because the FAB's flex centring does not
     reach positioned children. */
  .ring,
  .hub {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 9999px;
  }

  /* A circle inscribed in the unchanged square: the FAB keeps its silhouette
     and shadow, so it still reads as the same control as the groups below. */
  .ring {
    width: 32px;
    height: 32px;
    opacity: 0.6;
  }

  /* Masks the conic's centre. Carries the gradient in its own element because
     `gradient-accent` sets background-image, which the ring's conic background
     would overwrite. */
  .hub {
    width: 26px;
    height: 26px;
  }

  /* Positioned so it paints above the two absolute siblings before it. */
  .glyph {
    position: relative;
    display: flex;
  }

  /* Pulsing means the map is following you, so it stops when a pan breaks the
     lock even though the session keeps running. */
  .pulsing {
    animation: pulse 2s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pulsing {
      animation: none;
    }
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
