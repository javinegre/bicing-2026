<script lang="ts">
  import type { StateColor } from '$lib/domain/types';

  interface Props {
    color: StateColor;
    size?: number;
  }

  const { color, size = 10 }: Props = $props();

  /**
   * "No resources left" is drawn as an outlined ring rather than a near-black
   * disc — on the #141010 sheet a filled #222 dot reads as a hole.
   */
  const outlined = $derived(color === 'black');
</script>

<span
  class="dot"
  class:outlined
  style:width="{size}px"
  style:height="{size}px"
  style:--dot-color="var(--color-state-{color})"
></span>

<style>
  .dot {
    flex: none;
    border-radius: 9999px;
    background: var(--dot-color);
  }

  .outlined {
    background: transparent;
    border: 2px solid rgba(255, 255, 255, 0.5);
    box-sizing: border-box;
  }
</style>
