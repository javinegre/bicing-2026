<script lang="ts">
  import AvailabilityRing from './AvailabilityRing.svelte';
  import Icon from './Icon.svelte';
  import StationRow from './StationRow.svelte';
  import { distanceMeters, walkingMinutes } from '$lib/domain/distance';
  import { rankByDistance } from '$lib/domain/nearby';
  import { resourceCount } from '$lib/domain/station';
  import { mapState } from '$lib/state/map.svelte';
  import { planState } from '$lib/state/plan.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import { uiState } from '$lib/state/ui.svelte';

  const CLOSEST_SHOWN = 5;
  const DRAG_DISMISS_THRESHOLD = 64;

  /** Null while not dragging; the touch's starting Y while a drag is live. */
  let dragStartY = $state<number | null>(null);
  let dragOffset = $state(0);

  /**
   * Closing hands the map back its full height, so the lift `centerOnMarker`
   * applied to keep the pin clear of the sheet (see map.svelte.ts) is now a
   * vertical offset with nothing to clear — undo it by re-centring on the
   * selected station's real coordinates, putting it back in the middle of
   * the now-full map instead of high in what was the visible band above the
   * sheet.
   */
  function dismiss(): void {
    uiState.closeSheet();
    if (selected) mapState.panTo(selected);
  }

  /**
   * Drag-to-dismiss listens on the whole sheet rather than just the grabber
   * so a swipe anywhere on the header area works, but bails out of drags that
   * start inside `.list` — that region owns its own vertical scroll.
   */
  function handleDragStart(event: TouchEvent): void {
    if (!uiState.sheetOpen) return;
    if ((event.target as HTMLElement).closest('.list')) return;
    const touch = event.touches[0];
    if (!touch) return;
    dragStartY = touch.clientY;
    dragOffset = 0;
  }

  function handleDragMove(event: TouchEvent): void {
    if (dragStartY === null) return;
    const touch = event.touches[0];
    if (!touch) return;
    dragOffset = Math.max(0, touch.clientY - dragStartY);
  }

  function handleDragEnd(): void {
    if (dragOffset > DRAG_DISMISS_THRESHOLD) dismiss();
    dragStartY = null;
    dragOffset = 0;
  }

  /** With nothing selected the sheet describes the map centre instead. */
  const selected = $derived(
    uiState.selectedStationId === null
      ? null
      : (stationsState.byId(uiState.selectedStationId) ?? null),
  );

  const anchor = $derived(selected ?? mapState.center);

  const closest = $derived(
    rankByDistance(stationsState.all, anchor, {
      limit: CLOSEST_SHOWN,
      excludeId: selected?.id ?? null,
    }),
  );

  const walk = $derived(
    selected ? walkingMinutes(distanceMeters(selected, mapState.center)) : null,
  );

  const freshness = $derived.by(() => {
    if (!stationsState.lastUpdated) return 'never updated';
    const seconds = Math.max(0, Math.round(Date.now() / 1000 - stationsState.lastUpdated));
    return seconds < 90
      ? `updated ${seconds} s ago`
      : `updated ${Math.round(seconds / 60)} min ago`;
  });

  const shownCount = $derived(
    selected ? resourceCount(selected, prefsState.resourceShown, prefsState.bikeTypeFilter) : 0,
  );

  const canPlan = $derived(selected !== null && planState.canAdd(selected));
</script>

<section
  class="sheet"
  class:closed={!uiState.sheetOpen}
  aria-label="Station detail"
  aria-hidden={!uiState.sheetOpen}
  inert={!uiState.sheetOpen}
  style:transform={dragOffset ? `translateY(${dragOffset}px)` : undefined}
  style:transition={dragStartY === null ? undefined : 'none'}
  ontouchstart={handleDragStart}
  ontouchmove={handleDragMove}
  ontouchend={handleDragEnd}
  ontouchcancel={handleDragEnd}
>
  <button type="button" class="grabber" aria-label="Dismiss station detail" onclick={dismiss}
  ></button>

  {#if selected}
    <header class="head">
      <AvailabilityRing
        station={selected}
        value={shownCount}
        label={prefsState.resourceShown === 'bikes' ? 'bikes' : 'docks'}
      />

      <div class="identity">
        <h2 class="name">{selected.name}</h2>
        <p class="meta">{walk} min away · {freshness}</p>
        <div class="legend">
          <span class="chip"
            ><i style:background="var(--color-mech)"></i><b data-count>{selected.mechanical}</b><em
              >mech</em
            ></span
          >
          <span class="chip"
            ><i style:background="var(--color-elec)"></i><b data-count>{selected.electrical}</b><em
              >elec</em
            ></span
          >
          <span class="chip"
            ><i style:background="var(--color-dock)"></i><b data-count>{selected.docks}</b><em
              >free</em
            ></span
          >
        </div>
      </div>

      <button
        type="button"
        class="action"
        class:on={prefsState.isSaved(selected.id)}
        aria-pressed={prefsState.isSaved(selected.id)}
        aria-label="Save station"
        onclick={() => prefsState.toggleSavedStation(selected.id)}
      >
        <Icon name="star" size={15} />
      </button>

      <button
        type="button"
        class="action"
        disabled={!canPlan}
        aria-label="Add to plan"
        onclick={() => planState.add(selected)}
      >
        <Icon name="tab-plan" size={16} />
      </button>
    </header>
  {:else}
    <header class="head empty">
      <h2 class="name">Around here</h2>
      <p class="meta">Tap a marker for the full picture · {freshness}</p>
    </header>
  {/if}

  <div class="list-head">
    <span class="label-caps">Closest stations</span>
    <button type="button" class="see-all" onclick={() => uiState.go('search')}>See all</button>
  </div>

  <div class="list">
    {#each closest as entry (entry.station.id)}
      <StationRow
        station={entry.station}
        distance={entry.walk}
        onselect={(s) => {
          uiState.select(s.id);
          mapState.centerOnMarker(s);
        }}
      />
    {:else}
      <p class="empty-list">
        {stationsState.error ?? (stationsState.loading ? 'Loading stations…' : 'No stations yet.')}
      </p>
    {/each}
  </div>
</section>

<style>
  .sheet {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    max-height: 54%;
    display: flex;
    flex-direction: column;
    padding: 10px 18px 0;
    box-sizing: border-box;
    background: var(--color-sheet);
    border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
    box-shadow: var(--shadow-sheet);
    transition: transform 0.2s ease;
    touch-action: none;
  }

  .sheet.closed {
    transform: translateY(100%);
    pointer-events: none;
  }

  .grabber {
    width: 44px;
    height: 4px;
    flex: none;
    display: block;
    border-radius: 2px;
    border: 0;
    padding: 0;
    background: var(--color-grabber);
    margin: 0 auto 16px;
    cursor: pointer;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: none;
  }

  .head.empty {
    display: block;
  }

  .identity {
    flex: 1;
    min-width: 0;
  }

  .name {
    margin: 0;
    font-weight: 600;
    font-size: 21px;
    line-height: 1.15;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta {
    margin: 2px 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: var(--color-ink-secondary);
  }

  .legend {
    display: flex;
    gap: 14px;
    margin-top: 8px;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .chip i {
    width: 7px;
    height: 7px;
    border-radius: 9999px;
  }

  .chip b {
    font-weight: 500;
    font-size: 13px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .chip em {
    font-style: normal;
    font-size: 12px;
    line-height: 1;
    color: var(--color-ink-label);
  }

  .action {
    width: 36px;
    height: 36px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    border: 1px solid var(--color-hairline);
    background: transparent;
    color: var(--color-ink);
    opacity: 0.75;
    cursor: pointer;
  }

  .action.on {
    opacity: 1;
    border: 0;
    background-image: linear-gradient(
      135deg,
      var(--color-accent-deep) 0%,
      var(--color-accent) 100%
    );
  }

  .action:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    flex: none;
  }

  .see-all {
    background: none;
    border: 0;
    padding: 0;
    font-weight: 500;
    font-size: 11px;
    line-height: 1;
    color: var(--color-accent);
    cursor: pointer;
  }

  .list {
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-bottom: 12px;
    /* Overrides the sheet's `touch-action: none` (needed for drag-to-dismiss)
       so this region keeps its own vertical touch scroll. */
    touch-action: pan-y;
  }

  .empty-list {
    padding: 18px 0;
    font-size: 13px;
    color: var(--color-ink-label);
  }
</style>
