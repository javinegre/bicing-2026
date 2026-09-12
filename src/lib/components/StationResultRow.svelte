<script lang="ts">
  import AvailabilityBar from './AvailabilityBar.svelte';
  import Icon from './Icon.svelte';
  import StateDot from './StateDot.svelte';
  import { resourceCount, stationColor } from '$lib/domain/station';
  import { planState } from '$lib/state/plan.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { uiState } from '$lib/state/ui.svelte';
  import type { Station } from '$lib/domain/types';

  interface Props {
    station: Station;
    /** Secondary line, e.g. "#178 · 1 min away". */
    subtitle?: string;
    onselect?: (station: Station) => void;
  }

  const { station, subtitle, onselect }: Props = $props();

  const color = $derived(stationColor(station, 'bikes', prefsState.bikeTypeFilter));
  const bikes = $derived(resourceCount(station, 'bikes', prefsState.bikeTypeFilter));
  const saved = $derived(prefsState.isSaved(station.id));
  const canPlan = $derived(planState.canAdd(station));

  const planHint = $derived(
    planState.origin?.id === station.id
      ? 'Already the origin of your plan'
      : planState.complete
        ? 'Plan is full — cancel it to start over'
        : planState.origin
          ? 'Set as destination'
          : 'Set as origin',
  );
</script>

<div class="row">
  <StateDot {color} />
  <button type="button" class="body" onclick={() => onselect?.(station)}>
    <span class="name">{station.name}</span>
    {#if subtitle}<span class="sub">{subtitle}</span>{/if}
    <span class="bar"><AvailabilityBar {station} /></span>
  </button>

  <div class="count">
    <div class="count-value" data-count>{bikes}</div>
    <div class="label-caps">bikes</div>
  </div>

  <button
    type="button"
    class="circle"
    class:saved
    aria-pressed={saved}
    aria-label={saved ? `Unsave ${station.name}` : `Save ${station.name}`}
    onclick={() => prefsState.toggleSavedStation(station.id)}
  >
    <Icon name="star" size={13} />
  </button>

  <button
    type="button"
    class="circle plan"
    disabled={!canPlan}
    title={planHint}
    aria-label={planHint}
    onclick={() => {
      planState.add(station);
      uiState.go('plan');
    }}
  >
    <Icon name="tab-plan" size={15} />
  </button>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--color-hairline);
  }

  .body {
    flex: 1;
    min-width: 0;
    display: block;
    background: none;
    border: 0;
    padding: 0;
    color: var(--color-ink);
    text-align: left;
    cursor: pointer;
  }

  .name {
    display: block;
    font-weight: 500;
    font-size: 16px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sub {
    display: block;
    font-size: 12px;
    line-height: 1.3;
    color: var(--color-ink-label);
    margin-top: 2px;
  }

  .bar {
    display: block;
    width: 120px;
    margin-top: 8px;
  }

  .count {
    text-align: right;
    flex: none;
  }

  .count-value {
    font-family: var(--font-condensed);
    font-weight: 500;
    font-size: 22px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .count .label-caps {
    margin-top: 4px;
  }

  .circle {
    width: 30px;
    height: 30px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    border: 1px solid var(--color-hairline);
    background: transparent;
    color: var(--color-ink);
    opacity: 0.5;
    cursor: pointer;
  }

  .circle.saved {
    opacity: 1;
    border: 0;
    background-image: linear-gradient(
      135deg,
      var(--color-accent-deep) 0%,
      var(--color-accent) 100%
    );
  }

  .plan {
    background: rgba(255, 255, 255, 0.06);
    opacity: 1;
  }

  .plan:disabled {
    background: transparent;
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
