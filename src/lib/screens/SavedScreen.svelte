<script lang="ts">
  import AvailabilityBar from '$lib/components/AvailabilityBar.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import StateDot from '$lib/components/StateDot.svelte';
  import StationRow from '$lib/components/StationRow.svelte';
  import TripDialog from '$lib/components/TripDialog.svelte';
  import { rankByDistance } from '$lib/domain/nearby';
  import { resourceCount, stationColor } from '$lib/domain/station';
  import { mapState } from '$lib/state/map.svelte';
  import { planState } from '$lib/state/plan.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import { tripsState } from '$lib/state/trips.svelte';
  import { uiState } from '$lib/state/ui.svelte';
  import type { BookmarkType, Station } from '$lib/domain/types';
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

  // Re-fetched each time this screen mounts (see tripsState.load), so a trip
  // saved from another device shows up without a manual refresh.
  $effect(() => {
    void tripsState.load();
  });

  const trips = $derived(
    tripsState.trips
      .map((trip) => {
        const origin = stationsState.byId(trip.origin);
        const destination = stationsState.byId(trip.destination);
        return origin && destination
          ? { id: trip.id, label: trip.label, origin, destination }
          : null;
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
  );

  function openTrip(origin: Station, destination: Station): void {
    planState.setOrigin(origin);
    planState.setDestination(destination);
    uiState.go('plan');
  }

  let editing = $state(false);

  function removePlace(type: BookmarkType): void {
    prefsState.setBookmark(type, null);
  }

  function removeStation(stationId: number): void {
    prefsState.toggleSavedStation(stationId);
  }

  let renameDialogOpen = $state(false);
  let renameTarget = $state<(typeof trips)[number] | null>(null);

  function openRename(trip: (typeof trips)[number]): void {
    renameTarget = trip;
    renameDialogOpen = true;
  }
</script>

<div class="screen">
  <header class="head">
    <div class="head-top">
      <h1>Saved</h1>
      <button type="button" class="edit-button" onclick={() => (editing = !editing)}>
        <Icon name={editing ? 'close' : 'edit'} size={14} />
        {editing ? 'Cancel' : 'Edit'}
      </button>
    </div>
    <p>Your places and the stations that serve them</p>
  </header>

  <div class="cards">
    {#each cards as card (card.type)}
      {#if card.position && card.best}
        {@const station = card.best.station}
        <div class="card">
          <button
            type="button"
            class="card-main"
            disabled={editing}
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
          {#if editing}
            <button type="button" class="action-button full" onclick={() => removePlace(card.type)}>
              Remove
            </button>
          {/if}
        </div>
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

  <div class="trips">
    <div class="label-caps">Saved trips</div>
    {#each trips as trip (trip.id)}
      <div class="list-row">
        <span class="list-icon"><Icon name="route" size={14} /></span>
        <button
          type="button"
          class="trip-main"
          disabled={editing}
          onclick={() => openTrip(trip.origin, trip.destination)}
        >
          <span class="row-label">{trip.label}</span>
          <span class="trip-route">{trip.origin.name} → {trip.destination.name}</span>
        </button>
        {#if editing}
          <span class="row-actions">
            <button type="button" class="action-button" onclick={() => openRename(trip)}>
              Rename
            </button>
            <button
              type="button"
              class="action-button"
              onclick={() => void tripsState.remove(trip.id)}
            >
              Remove
            </button>
          </span>
        {:else}
          <Icon name="chevron-right" size={14} />
        {/if}
      </div>
    {:else}
      <p class="none">Save a trip from Plan to keep it here.</p>
    {/each}
  </div>

  <div class="stations">
    <div class="label-caps">Saved stations</div>
    {#each savedStations as station (station.id)}
      {#if editing}
        <div class="list-row">
          <StateDot color={stationColor(station, 'bikes', prefsState.bikeTypeFilter)} />
          <span class="row-label station-edit-name">{station.name}</span>
          <button type="button" class="action-button" onclick={() => removeStation(station.id)}>
            Remove
          </button>
        </div>
      {:else}
        <StationRow
          {station}
          onselect={(s) => {
            mapState.panTo(s);
            uiState.select(s.id);
            uiState.go('map');
          }}
        />
      {/if}
    {:else}
      <p class="none">Star a station from Search or the map to keep it here.</p>
    {/each}
  </div>

  {#if renameTarget}
    <TripDialog
      bind:open={renameDialogOpen}
      origin={renameTarget.origin}
      destination={renameTarget.destination}
      trip={renameTarget}
    />
  {/if}
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

  .head-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  h1 {
    margin: 0;
    font-weight: 600;
    font-size: 30px;
    line-height: 1;
    letter-spacing: -0.015em;
  }

  .edit-button {
    height: 30px;
    flex: none;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    border-radius: 9999px;
    background: none;
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    font-family: inherit;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
  }

  .head p {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--color-ink-label);
  }

  /* Same bordered-pill formula as .edit-button, reused for the row-level
     Remove/Rename actions edit mode reveals. */
  .action-button {
    height: 30px;
    flex: none;
    padding: 0 14px;
    border-radius: 9999px;
    background: none;
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    font-family: inherit;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
  }

  .action-button.full {
    width: 100%;
    margin-top: 12px;
  }

  .cards {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    gap: 10px;
    padding: 20px 16px 0;
  }

  .card {
    display: block;
    flex: none;
    /* Narrower than the container so the next card peeks in as a scroll hint.
       Capped by min() too, or min-width would win over max-width past ~590px
       of container width and blow past the 500px cap. */
    min-width: min(85%, 500px);
    max-width: 500px;
    padding: 14px 16px;
    box-sizing: border-box;
    border-radius: var(--radius-surface);
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
  }

  .card.placeholder {
    display: flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border-style: dashed;
    cursor: default;
  }

  .card-main {
    display: block;
    width: 100%;
    padding: 0;
    background: none;
    border: 0;
    text-align: left;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .card-main:disabled {
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

  .trips {
    padding: 26px 16px 0;
  }

  .list-row {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 11px 0;
    border-bottom: 1px solid var(--color-hairline);
    color: var(--color-ink);
  }

  .list-icon {
    width: 26px;
    height: 26px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink-secondary);
  }

  .trip-main {
    flex: 1;
    min-width: 0;
    display: block;
    padding: 0;
    background: none;
    border: 0;
    text-align: left;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .trip-main:disabled {
    cursor: default;
  }

  .row-actions {
    display: flex;
    flex: none;
    gap: 8px;
  }

  .station-edit-name {
    flex: 1;
    min-width: 0;
  }

  .row-label {
    display: block;
    font-weight: 500;
    font-size: 15px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trip-route {
    display: block;
    font-size: 12px;
    line-height: 1.3;
    color: var(--color-ink-label);
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
