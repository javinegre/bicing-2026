<script lang="ts">
  import Icon from './Icon.svelte';
  import { uiState, type Tab } from '$lib/state/ui.svelte';
  import type { IconName } from '$lib/icons';

  const TAB_META: Record<Tab, { icon: IconName; label: string }> = {
    map: { icon: 'tab-map', label: 'Map' },
    plan: { icon: 'tab-plan', label: 'Plan' },
    search: { icon: 'tab-search', label: 'Search' },
    saved: { icon: 'star', label: 'Saved' },
    info: { icon: 'tab-info', label: 'Info' },
    account: { icon: 'tab-account', label: 'Account' },
  };
</script>

<nav class="tabbar" aria-label="Sections">
  {#each uiState.visibleTabs as tab (tab)}
    {@const meta = TAB_META[tab]}
    {@const active = uiState.tab === tab}
    <button
      type="button"
      class="tab"
      class:active
      aria-current={active ? 'page' : undefined}
      onclick={() => uiState.go(tab)}
    >
      <Icon name={meta.icon} size={20} />
      <span class="tab-label">{meta.label}</span>
    </button>
  {/each}
</nav>

<style>
  .tabbar {
    flex: none;
    height: 60px;
    display: flex;
    padding-bottom: 6px;
    background: var(--color-tabbar);
    border-top: 1px solid var(--color-hairline);
  }

  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background: none;
    border: 0;
    padding: 0;
    color: var(--color-ink);
    opacity: 0.45;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .tab.active {
    opacity: 1;
    color: var(--color-accent);
  }

  .tab-label {
    font-weight: 600;
    font-size: 10px;
    line-height: 1;
  }
</style>
