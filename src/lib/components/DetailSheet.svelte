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

<section class="sheet" aria-label="Station detail">
  <div class="grabber"></div>

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
        onselect={(s) => uiState.select(s.id)}
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
  }

  .grabber {
    width: 44px;
    height: 4px;
    flex: none;
    border-radius: 2px;
    background: var(--color-grabber);
    margin: 0 auto 16px;
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
  }

  .empty-list {
    padding: 18px 0;
    font-size: 13px;
    color: var(--color-ink-label);
  }
</style>
