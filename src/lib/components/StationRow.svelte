<script lang="ts">
  import AvailabilityBar from './AvailabilityBar.svelte';
  import StateDot from './StateDot.svelte';
  import { resourceCount, stationColor } from '$lib/domain/station';
  import { prefsState } from '$lib/state/prefs.svelte';
  import type { Station } from '$lib/domain/types';

  interface Props {
    station: Station;
    /** Pre-formatted walking time, e.g. "3 min". Omitted in lists without a centre. */
    distance?: string;
    onselect?: (station: Station) => void;
  }

  const { station, distance, onselect }: Props = $props();

  const color = $derived(
    stationColor(station, prefsState.resourceShown, prefsState.bikeTypeFilter),
  );
  const bikes = $derived(resourceCount(station, 'bikes', prefsState.bikeTypeFilter));
</script>

<button type="button" class="row" onclick={() => onselect?.(station)}>
  <StateDot {color} />
  {#if distance}
    <span class="distance">{distance}</span>
  {/if}
  <span class="body">
    <span class="name">{station.name}</span>
    <AvailabilityBar {station} />
  </span>
  <span class="counts">
    <span data-count>{bikes}</span>
    <span class="docks" data-count>{station.docks}</span>
  </span>
</button>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 11px 0;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--color-hairline);
    color: var(--color-ink);
    text-align: left;
    cursor: pointer;
  }

  .distance {
    width: 46px;
    flex: none;
    font-family: var(--font-condensed);
    font-weight: 500;
    font-size: 15px;
    line-height: 1;
    color: var(--color-ink-label);
    font-variant-numeric: tabular-nums;
  }

  .body {
    flex: 1;
    min-width: 0;
    display: block;
  }

  .name {
    display: block;
    font-weight: 500;
    font-size: 15px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 6px;
  }

  .counts {
    display: flex;
    align-items: baseline;
    gap: 9px;
    flex: none;
    font-family: var(--font-condensed);
    font-weight: 500;
    font-size: 16px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .docks {
    color: var(--color-ink-label);
  }
</style>
