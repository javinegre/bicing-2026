<script lang="ts">
  import TabBar from '$lib/components/TabBar.svelte';
  import AccountScreen from '$lib/screens/AccountScreen.svelte';
  import InfoScreen from '$lib/screens/InfoScreen.svelte';
  import MapScreen from '$lib/screens/MapScreen.svelte';
  import PlanScreen from '$lib/screens/PlanScreen.svelte';
  import SavedScreen from '$lib/screens/SavedScreen.svelte';
  import SearchScreen from '$lib/screens/SearchScreen.svelte';
  import { geoState } from '$lib/state/geo.svelte';
  import { mapState } from '$lib/state/map.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import { sessionState } from '$lib/state/session.svelte';
  import { stationsState } from '$lib/state/stations.svelte';
  import { uiState } from '$lib/state/ui.svelte';

  /**
   * Boot order matters: the session decides whether preferences come from the
   * account or from this device, and preferences carry the map view the user
   * left, so the map must not mount before both have settled.
   */
  $effect(() => {
    let cancelled = false;

    void (async () => {
      geoState.restore();
      await sessionState.load();
      if (cancelled) return;
      await prefsState.load();
      if (cancelled) return;
      mapState.restore();
      stationsState.start();
    })();

    return () => {
      cancelled = true;
      stationsState.stop();
      // A pending debounced write would otherwise be lost on unload.
      void prefsState.flush();
    };
  });

  const booted = $derived(sessionState.status === 'ready' && prefsState.loaded);
</script>

<div class="app">
  {#if !booted}
    <div class="boot" role="status">Loading…</div>
  {:else if uiState.tab === 'map'}
    <MapScreen />
  {:else if uiState.tab === 'plan'}
    <PlanScreen />
  {:else if uiState.tab === 'search'}
    <SearchScreen />
  {:else if uiState.tab === 'saved'}
    <SavedScreen />
  {:else if uiState.tab === 'info'}
    <InfoScreen />
  {:else}
    <AccountScreen />
  {/if}

  <TabBar />
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--color-canvas);
  }

  .boot {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-ink-label);
    font-size: 14px;
  }
</style>
