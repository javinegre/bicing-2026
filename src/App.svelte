<script lang="ts">
  import EnvBadge from '$lib/components/EnvBadge.svelte';
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

  function onPopState() {
    uiState.syncFromLocation();
  }

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

  // Mirrors browser back/forward into ui state without recording new
  // history — the browser already owns those entries. See ui.svelte.ts's
  // push/replace-vs-sync split for why a reactive `$effect` on `uiState.tab`
  // can't do this instead (it would double-push on every popstate).
  $effect(() => {
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  });

  // Dynamic import so the toolbar (and its dependency weight) never ships to
  // production — only staging and local dev get the 21st.dev browser toolbar.
  $effect(() => {
    if (__APP_ENV__ === 'production') return;

    let cancelled = false;
    void import('@21st-extension/toolbar').then(({ initToolbar }) => {
      if (cancelled) return;
      initToolbar({ plugins: [] });
    });

    return () => {
      cancelled = true;
    };
  });

  const booted = $derived(sessionState.status === 'ready' && prefsState.loaded);

  // A deep link (or a sign-out) can leave `tab` pointing at a slot that
  // isn't in the bar for this session — e.g. /search while signed out.
  // Runs once booted, and again any time `visibleTabs` or `tab` change, so
  // it also catches signing out while sitting on Search/Saved.
  $effect(() => {
    if (booted && !uiState.visibleTabs.includes(uiState.tab)) uiState.redirectToMap();
  });
</script>

<div class="app">
  {#if __APP_ENV__ !== 'production'}
    <EnvBadge env={__APP_ENV__} />
  {/if}

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
