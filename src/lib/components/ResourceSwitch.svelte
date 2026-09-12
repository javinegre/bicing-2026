<script lang="ts">
  import { ToggleGroup } from 'bits-ui';
  import Icon from './Icon.svelte';
  import { prefsState } from '$lib/state/prefs.svelte';
  import type { ResourceType } from '$lib/domain/types';

  /**
   * Bits UI owns the group's internal selection, so this has to be a two-way
   * binding. A one-way `value` plus an onValueChange guard leaves the child's
   * state diverged from ours the moment someone taps the already-active item
   * (the group deselects it and the guard can't put it back).
   */
  function write(next: string) {
    if (next === 'bikes' || next === 'docks') prefsState.setResourceShown(next as ResourceType);
  }

  /**
   * Only two states exist, so any click inside the switch means "flip it" -
   * including a tap on the already-active item, which Bits UI would
   * otherwise treat as a deselect (a no-op, caught by `write` above). Handling
   * the click on capture, before it reaches an item, and stopping it there
   * keeps Bits UI's own item click logic from also firing and fighting this.
   */
  function toggleOnClick(event: MouseEvent) {
    event.stopPropagation();
    prefsState.setResourceShown(prefsState.resourceShown === 'bikes' ? 'docks' : 'bikes');
  }
</script>

<ToggleGroup.Root
  type="single"
  bind:value={() => prefsState.resourceShown, write}
  class="switch"
  aria-label="Show bikes or docks"
  onclickcapture={toggleOnClick}
>
  <ToggleGroup.Item value="bikes" class="switch-item" aria-label="Bikes">
    <Icon name="bike" size={24} />
  </ToggleGroup.Item>
  <ToggleGroup.Item value="docks" class="switch-item" aria-label="Docks">
    <Icon name="parking" size={16} />
  </ToggleGroup.Item>
</ToggleGroup.Root>

<style>
  :global(.switch) {
    position: relative;
    display: flex;
    align-items: center;
    width: 88px;
    height: 46px;
    padding: 3px;
    box-sizing: border-box;
    border-radius: 9999px;
    background: rgba(16, 13, 13, 0.88);
    border: 1px solid var(--color-hairline);
  }

  :global(.switch-item) {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 9999px;
    background: transparent;
    color: var(--color-ink);
    opacity: 0.45;
    cursor: pointer;
  }

  :global(.switch-item[data-state='on']) {
    opacity: 1;
    background-image: linear-gradient(
      135deg,
      var(--color-accent-deep) 0%,
      var(--color-accent) 100%
    );
  }
</style>
