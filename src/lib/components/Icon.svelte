<script lang="ts">
  import { iconSvg, type IconName } from '$lib/icons';

  interface Props {
    name: IconName;
    /** Rendered box in px; the glyph scales to fill it. */
    size?: number;
    class?: string;
    label?: string;
  }

  const { name, size = 20, class: className = '', label }: Props = $props();
</script>

<span
  class="icon {className}"
  style:width="{size}px"
  style:height="{size}px"
  role={label ? 'img' : 'presentation'}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- bundled first-party assets, not user input -->
  {@html iconSvg(name)}
</span>

<style>
  .icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
  }

  .icon :global(svg) {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
</style>
