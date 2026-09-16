<script lang="ts">
  import { availabilitySplit } from '$lib/domain/station';
  import type { Station } from '$lib/domain/types';

  interface Props {
    station: Pick<Station, 'mechanical' | 'electrical' | 'docks'>;
    height?: number;
    /** Free docks read as an empty track in lists, as solid grey in cards. */
    solidDocks?: boolean;
    /** Non-operative stations lose the mech/elec colour coding entirely. */
    disabled?: boolean;
  }

  const { station, height = 3, solidDocks = false, disabled = false }: Props = $props();
  const split = $derived(availabilitySplit(station));

  const mechColor = $derived(disabled ? 'var(--color-ink-secondary)' : 'var(--color-mech)');
  const elecColor = $derived(disabled ? 'var(--color-ink-label)' : 'var(--color-elec)');
</script>

<div class="bar" style:height="{height}px" aria-hidden="true">
  <div style:width="{split.mechanical}%" style:background={mechColor}></div>
  <div style:width="{split.electrical}%" style:background={elecColor}></div>
  <div
    style:width="{split.docks}%"
    style:background={solidDocks ? 'var(--color-dock)' : 'var(--color-track)'}
  ></div>
</div>

<style>
  .bar {
    display: flex;
    border-radius: 2px;
    overflow: hidden;
  }
</style>
