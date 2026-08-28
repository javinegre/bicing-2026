<script lang="ts">
  import AvailabilityBar from '$lib/components/AvailabilityBar.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import StateDot from '$lib/components/StateDot.svelte';
  import StationRow from '$lib/components/StationRow.svelte';
  import { rankByDistance } from '$lib/domain/nearby';
  import { resourceCount, stationColor } from '$lib/domain/station';
  import { mapState } from '$lib/state/map.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import { uiState } from '$lib/state/ui.svelte';
  import type { BookmarkType } from '$lib/domain/types';
  import type { IconName } from '$lib/icons';

  const PLACES: { type: BookmarkType; icon: IconName; label: string }[] = [
    { type: 'home', icon: 'home', label: 'Home' },
    { type: 'work', icon: 'briefcase', label: 'Work' },
    { type: 'favorite', icon: 'star', label: 'Favorite place' },
  ];

  /**
   * A bookmark is a *place*, not a station — which station serves it changes as
   * bikes come and go, so each card resolves its best nearby station live.
   */
  const cards = $derived(
    PLACES.map((place) => {
      const position = prefsState.bookmarks[place.type];
      const best = position
        ? (rankByDistance(stationsState.all, position, { limit: 1 })[0] ?? null)
        : null;
      return {
        type: place.type,
        icon: place.icon,
        label: place.label,
        position,
        best,
      };
    }),
  );

  const savedStations = $derived(
    prefsState.savedStationIds
      .map((id) => stationsState.byId(id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined),
  );
</script>

<div class="screen">
  <header class="head">
    <h1>Saved</h1>
    <p>Your places and the stations that serve them</p>
  </header>

  <div class="cards">
    {#each cards as card (card.type)}
      {#if card.position && card.best}
        {@const station = card.best.station}
        <button
          type="button"
          class="card"
          onclick={() => {
            mapState.panTo(station);
            uiState.select(station.id);
            uiState.go('map');
          }}
        >
          <span class="card-head">
            <span class="badge gradient-accent"><Icon name={card.icon} size={13} /></span>
            <span class="card-title">{card.label}</span>
          </span>
          <span class="card-body">
            <StateDot color={stationColor(station, 'bikes', prefsState.bikeTypeFilter)} />
            <span class="card-station">
              <span class="station-name">{station.name}</span>
              <span class="station-meta">{card.best.walk} away · best nearby</span>
              <AvailabilityBar {station} height={4} solidDocks />
            </span>
            <span class="stat">
              <span class="stat-value" data-count
                >{resourceCount(station, 'bikes', prefsState.bikeTypeFilter)}</span
              >
              <span class="label-caps">bikes</span>
            </span>
            <span class="stat">
              <span class="stat-value muted" data-count>{station.docks}</span>
              <span class="label-caps">docks</span>
            </span>
          </span>
        </button>
      {:else}
        <div class="card placeholder">
          <span class="badge outline"><Icon name={card.icon} size={13} /></span>
          <span class="card-station">
            <span class="station-name">{card.label}</span>
            <span class="station-meta"
              >Center the map and tap {card.label.toLowerCase()} to set it</span
            >
          </span>
        </div>
      {/if}
    {/each}
  </div>

  <div class="stations">
    <div class="label-caps">Saved stations</div>
    {#each savedStations as station (station.id)}
      <StationRow
        {station}
        onselect={(s) => {
          mapState.panTo(s);
          uiState.select(s.id);
          uiState.go('map');
        }}
      />
    {:else}
      <p class="none">Star a station from Search or the map to keep it here.</p>
    {/each}
  </div>
</div>

<style>
  .screen {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: var(--color-canvas);
  }

  .head {
    padding: 22px 16px 0;
  }

  h1 {
    margin: 0;
    font-weight: 600;
    font-size: 30px;
    line-height: 1;
    letter-spacing: -0.015em;
  }

  .head p {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--color-ink-label);
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px 16px 0;
  }

  .card {
    display: block;
    width: 100%;
    text-align: left;
    padding: 14px 16px;
    box-sizing: border-box;
    border-radius: var(--radius-surface);
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    cursor: pointer;
  }

  .card.placeholder {
    display: flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border-style: dashed;
    cursor: default;
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .badge {
    width: 26px;
    height: 26px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
  }

  .badge.outline {
    border: 1px solid var(--color-hairline);
  }

  .card-title {
    flex: 1;
    font-weight: 600;
    font-size: 16px;
    line-height: 1;
  }

  .card-body {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }

  .card-station {
    flex: 1;
    min-width: 0;
  }

  .station-name {
    display: block;
    font-weight: 500;
    font-size: 15px;
    line-height: 1.2;
  }

  .station-meta {
    display: block;
    font-size: 11px;
    line-height: 1;
    color: var(--color-ink-label);
    margin: 4px 0 8px;
  }

  .stat {
    text-align: right;
    flex: none;
  }

  .stat-value {
    display: block;
    font-family: var(--font-condensed);
    font-weight: 500;
    font-size: 26px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .stat-value.muted {
    color: var(--color-ink-secondary);
  }

  .stat .label-caps {
    margin-top: 4px;
  }

  .stations {
    padding: 26px 16px 24px;
  }

  .none {
    padding: 14px 0;
    font-size: 13px;
    color: var(--color-ink-label);
  }
</style>
