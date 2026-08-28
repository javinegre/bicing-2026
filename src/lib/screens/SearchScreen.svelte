<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import StationResultRow from '$lib/components/StationResultRow.svelte';
  import { walkingMinutes, distanceMeters } from '$lib/domain/distance';
  import { matchStations } from '$lib/domain/nearby';
  import { mapState } from '$lib/state/map.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import { uiState } from '$lib/state/ui.svelte';
  import type { BookmarkType } from '$lib/domain/types';
  import type { IconName } from '$lib/icons';

  const BOOKMARKS: { type: BookmarkType; icon: IconName; label: string }[] = [
    { type: 'home', icon: 'home', label: 'Home' },
    { type: 'work', icon: 'briefcase', label: 'Work' },
    { type: 'favorite', icon: 'star', label: 'Favorite' },
  ];

  const results = $derived(matchStations(stationsState.all, uiState.searchQuery));

  function subtitle(id: number, lat: number, lng: number) {
    return `#${id} · ${walkingMinutes(distanceMeters({ lat, lng }, mapState.center))} min away`;
  }

  function jump(type: BookmarkType) {
    const saved = prefsState.bookmarks[type];
    if (!saved) return;
    mapState.panTo(saved);
    uiState.go('map');
  }
</script>

<div class="screen">
  <div class="head">
    <div class="field">
      <Icon name="search" size={16} class="field-icon" />
      <input
        type="search"
        placeholder="Search stations"
        bind:value={uiState.searchQuery}
        aria-label="Search stations"
      />
      {#if uiState.searchQuery}
        <button
          type="button"
          class="clear"
          aria-label="Clear search"
          onclick={() => (uiState.searchQuery = '')}
        >
          <Icon name="close" size={11} />
        </button>
      {/if}
    </div>

    <div class="chips">
      {#each BOOKMARKS as bookmark (bookmark.type)}
        {@const set = prefsState.bookmarks[bookmark.type] !== null}
        <button
          type="button"
          class="chip"
          class:unset={!set}
          disabled={!set}
          onclick={() => jump(bookmark.type)}
        >
          <Icon name={bookmark.icon} size={12} />
          <span>{set ? bookmark.label : `Set ${bookmark.label.toLowerCase()}`}</span>
        </button>
      {/each}
    </div>

    <p class="label-caps count-line">
      {uiState.searchQuery ? `${results.length} stations` : 'Type to search'}
    </p>
  </div>

  <div class="results">
    {#each results as station (station.id)}
      <StationResultRow
        {station}
        subtitle={subtitle(station.id, station.lat, station.lng)}
        onselect={(s) => {
          mapState.panTo(s);
          uiState.select(s.id);
          uiState.go('map');
        }}
      />
    {/each}
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
    flex: none;
    padding: 16px 16px 0;
  }

  .field {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 48px;
    padding: 0 14px;
    box-sizing: border-box;
    border-radius: var(--radius-sheet);
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
  }

  .field :global(.field-icon) {
    opacity: 0.6;
  }

  input {
    flex: 1;
    min-width: 0;
    background: none;
    border: 0;
    outline: none;
    color: var(--color-ink);
    font-family: inherit;
    font-weight: 500;
    font-size: 15px;
  }

  input::placeholder {
    color: var(--color-ink-label);
  }

  .clear {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.16);
    color: var(--color-ink);
    cursor: pointer;
  }

  .chips {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 34px;
    padding: 0 13px;
    border-radius: 9999px;
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink);
    font-family: inherit;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
  }

  .chip.unset {
    border-style: dashed;
    opacity: 0.55;
    cursor: default;
  }

  .count-line {
    margin: 24px 0 4px;
  }

  .results {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 16px 16px;
  }
</style>
