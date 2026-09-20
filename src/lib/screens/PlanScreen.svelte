<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import LegMap from '$lib/components/LegMap.svelte';
  import TripDialog from '$lib/components/TripDialog.svelte';
  import { resourceCount } from '$lib/domain/station';
  import { mapState } from '$lib/state/map.svelte';
  import { planState, type PlanLeg } from '$lib/state/plan.svelte';
  import { sessionState } from '$lib/state/session.svelte';
  import { uiState } from '$lib/state/ui.svelte';
  import type { Station } from '$lib/domain/types';

  let saveDialogOpen = $state(false);

  /**
   * Two stacked halves: where to pick a bike up, and where to leave it.
   * Whichever leg is leading takes 65% — the one still being picked, or, once
   * both are set, the one the person focused.
   *
   * A leg shows a live map as soon as it is either chosen or the one being
   * picked; the leg after that stays a plain panel, so an untouched plan opens
   * on one map, not two.
   */
  const legs = $derived([
    {
      key: 'origin' as const,
      caption: 'From',
      resource: 'bikes' as const,
      unit: 'bikes',
      cta: 'Choose origin',
      label: 'Map of stations to start from',
      station: planState.origin,
      mapped: planState.origin !== null || planState.leading === 'origin',
      grow: planState.topGrow,
    },
    {
      key: 'destination' as const,
      caption: 'To',
      resource: 'docks' as const,
      unit: 'docks',
      cta: 'Choose destination',
      label: 'Map of stations to finish at',
      station: planState.destination,
      mapped: planState.destination !== null || planState.leading === 'destination',
      grow: 100 - planState.topGrow,
    },
  ]);

  function pick(leg: PlanLeg, station: Station): void {
    if (leg === 'origin') planState.setOrigin(station);
    else planState.setDestination(station);
  }

  function openInMap(station: Station): void {
    mapState.panTo(station);
    uiState.select(station.id);
    uiState.go('map');
  }
</script>

<div class="screen">
  <header class="head">
    <h1>Plan</h1>
    {#if planState.active}
      {#if sessionState.signedIn}
        <button
          type="button"
          class="save-trip gradient-accent"
          onclick={() => (saveDialogOpen = true)}
        >
          Save trip
        </button>
      {/if}
      <button type="button" class="cancel" onclick={() => planState.cancel()}>Cancel</button>
    {/if}
  </header>

  {#if planState.origin && planState.destination}
    <TripDialog
      bind:open={saveDialogOpen}
      origin={planState.origin}
      destination={planState.destination}
    />
  {/if}

  <div class="legs">
    {#each legs as leg (leg.key)}
      <div
        class="leg"
        class:bottom={leg.key === 'destination'}
        class:blank={!leg.mapped}
        class:focused={planState.mode === leg.key}
        style:flex={leg.grow}
      >
        {#if leg.mapped}
          <LegMap
            station={leg.station}
            resource={leg.resource}
            label={leg.label}
            onPick={(station) => pick(leg.key, station)}
            onOpenInMap={openInMap}
          />
          <span class="leg-tag control-glass">
            <Icon name={leg.resource === 'bikes' ? 'bike' : 'parking'} size={13} />
            {leg.resource === 'bikes' ? 'Bikes' : 'Docks'}
          </span>

          {#if leg.station}
            <!-- The foot, not the whole half, is the hit target for "give this
                 leg the space" — the map underneath has to stay tappable for
                 picking, and a full-surface button would swallow every marker. -->
            <button
              type="button"
              class="leg-foot"
              disabled={!planState.complete}
              onclick={() => planState.focus(leg.key)}
            >
              <span class="leg-name">
                <span class="label-caps">{leg.caption}</span>
                <span class="name">{leg.station.name}</span>
              </span>
              <span class="leg-count">
                <span class="count" data-count>{resourceCount(leg.station, leg.resource)}</span>
                <span class="label-caps">{leg.unit}</span>
              </span>
            </button>
          {:else}
            <div class="leg-foot">
              <span class="leg-name"><span class="label-caps">{leg.caption}</span></span>
              <button
                type="button"
                class="cta gradient-accent"
                onclick={() => uiState.go('search')}
              >
                <Icon name="search" size={15} />
                {leg.cta}
              </button>
            </div>
          {/if}
        {:else}
          <div class="empty">
            <span class="label-caps">{leg.caption}</span>
            <button type="button" class="cta gradient-accent" onclick={() => uiState.go('search')}>
              <Icon name="search" size={15} />
              {leg.cta}
            </button>
          </div>
        {/if}
      </div>
    {/each}

    {#if planState.active}
      <button
        type="button"
        class="swap gradient-accent"
        style:top="calc({planState.topGrow}% - 22px)"
        aria-label="Swap which leg leads"
        onclick={() => planState.swap()}
      >
        <Icon name="swap" size={20} />
      </button>
    {/if}
  </div>
</div>

<style>
  .screen {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--color-canvas);
  }

  .head {
    display: flex;
    align-items: center;
    padding: 20px 16px 14px;
    flex: none;
  }

  h1 {
    margin: 0;
    font-weight: 600;
    font-size: 30px;
    line-height: 1;
    letter-spacing: -0.015em;
  }

  .cancel {
    margin-left: auto;
    height: 32px;
    padding: 0 14px;
    border-radius: 9999px;
    border: 1px solid var(--color-hairline);
    background: none;
    color: var(--color-ink-secondary);
    font-family: inherit;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
  }

  .save-trip {
    margin-left: auto;
    height: 32px;
    padding: 0 14px;
    border: 0;
    border-radius: 9999px;
    color: var(--color-ink);
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
  }

  .save-trip + .cancel {
    margin-left: 8px;
  }

  .legs {
    flex: 1;
    min-height: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .leg {
    position: relative;
    min-height: 0;
    overflow: hidden;
    background: #141010;
    color: var(--color-ink);
    transition: flex 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* The hatched fill marks the half that is not in play yet — the leg after
     the one being picked, which carries no map. */
  .leg.blank {
    background:
      repeating-linear-gradient(45deg, #242020 0 12px, transparent 12px 58px),
      repeating-linear-gradient(135deg, #242020 0 12px, transparent 12px 58px), #141010;
  }

  .leg.bottom {
    border-top: 6px solid var(--color-divider);
  }

  .leg.focused {
    box-shadow: inset 0 0 0 2px var(--color-accent);
  }

  .leg-tag {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 11px;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 11px;
  }

  .leg-foot {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    background: rgba(13, 11, 11, 0.94);
    border: 0;
    border-top: 1px solid var(--color-hairline);
    color: inherit;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  /* Focus is only a choice once both legs are set; until then the foot is
     just the caption strip. */
  .leg-foot:disabled {
    cursor: default;
  }

  /* Smaller than the centred call to action — it shares the strip with the
     caption rather than owning the whole half. */
  .leg-foot .cta {
    height: 38px;
    padding: 0 16px;
    font-size: 13px;
  }

  .leg-name {
    flex: 1;
    min-width: 0;
  }

  .leg-name .name {
    display: block;
    font-weight: 600;
    font-size: 17px;
    line-height: 1.2;
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .leg-count {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: none;
  }

  .count {
    font-family: var(--font-condensed);
    font-weight: 500;
    font-size: 22px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .cta {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 46px;
    padding: 0 20px;
    border: 0;
    border-radius: 23px;
    color: var(--color-ink);
    font-family: inherit;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }

  .swap {
    position: absolute;
    right: 14px;
    z-index: 4;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 9999px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
    color: var(--color-ink);
    cursor: pointer;
    transition: top 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>
