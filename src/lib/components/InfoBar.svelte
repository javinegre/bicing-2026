<script lang="ts">
  import Icon from './Icon.svelte';
  import { isNearby } from '$lib/domain/distance';
  import { mapState } from '$lib/state/map.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import { uiState } from '$lib/state/ui.svelte';

  /**
   * Totals for the ~340 m circle drawn on the map, counting in-service stations
   * only — an out-of-service station's numbers aren't bikes you can take.
   */
  const totals = $derived.by(() => {
    const acc = { mechanical: 0, electrical: 0, docks: 0 };
    for (const station of stationsState.all) {
      if (station.status !== 1 || !isNearby(station, mapState.center)) continue;
      acc.mechanical += station.mechanical;
      acc.electrical += station.electrical;
      acc.docks += station.docks;
    }
    return acc;
  });

  const bikes = $derived(totals.mechanical + totals.electrical);
</script>

<div
  class="infobar gradient-accent"
  role="button"
  tabindex="0"
  aria-label="Around here"
  onclick={() => uiState.select(null)}
  onkeydown={(event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    uiState.select(null);
  }}
>
  <div class="total">
    <span class="total-value" data-count>{bikes}</span>
    <Icon name="bike" size={21} class="total-icon" />
  </div>

  <div class="filters">
    <button
      type="button"
      class="chip"
      class:on={prefsState.bikeTypeFilter === 'mechanical'}
      aria-pressed={prefsState.bikeTypeFilter === 'mechanical'}
      onclick={(event) => {
        event.stopPropagation();
        prefsState.toggleBikeTypeFilter('mechanical');
      }}
    >
      <span data-count>{totals.mechanical}</span>
      <Icon name="bike" size={14} />
    </button>
    <button
      type="button"
      class="chip"
      class:on={prefsState.bikeTypeFilter === 'electrical'}
      aria-pressed={prefsState.bikeTypeFilter === 'electrical'}
      onclick={(event) => {
        event.stopPropagation();
        prefsState.toggleBikeTypeFilter('electrical');
      }}
    >
      <span data-count>{totals.electrical}</span>
      <Icon name="bolt" size={11} />
    </button>
  </div>

  <div class="docks">
    <span class="docks-value" data-count>{totals.docks}</span>
    <Icon name="parking" size={15} />
  </div>
</div>

<style>
  .infobar {
    position: absolute;
    top: 14px;
    left: 12px;
    right: 12px;
    height: 58px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    box-sizing: border-box;
    border-radius: var(--radius-surface);
    border: 1px solid var(--color-hairline);
    box-shadow: var(--shadow-infobar);
    cursor: pointer;
  }

  .total {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .total-value {
    font-family: var(--font-condensed);
    font-weight: 500;
    font-size: 32px;
    line-height: 1;
  }

  .total :global(.total-icon) {
    opacity: 0.75;
    position: relative;
    top: 3px;
  }

  .filters {
    display: flex;
    gap: 6px;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 9px;
    border: 0;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.18);
    color: var(--color-ink);
    font-weight: 600;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
  }

  /* Selected state is a filled chip, not a change in opacity — opacity read as
     "disabled" in the 2023 app. */
  .chip.on {
    background: var(--color-ink);
    color: var(--color-accent-deep);
  }

  .docks {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 11px 0 12px;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.2);
    opacity: 0.9;
  }

  .docks-value {
    font-family: var(--font-condensed);
    font-weight: 500;
    font-size: 24px;
    line-height: 1;
  }
</style>
