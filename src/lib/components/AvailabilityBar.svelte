<script lang="ts">
  import { availabilitySplit } from '$lib/domain/station';
  import type { Station } from '$lib/domain/types';

  interface Props {
    station: Pick<Station, 'mechanical' | 'electrical' | 'docks'>;
    height?: number;
    /** Free docks read as an empty track in lists, as solid grey in cards. */
    solidDocks?: boolean;
  }

  const { station, height = 3, solidDocks = false }: Props = $props();
  const split = $derived(availabilitySplit(station));
</script>

<div class="bar" style:height="{height}px" aria-hidden="true">
  <div style:width="{split.mechanical}%" style:background="var(--color-mech)"></div>
  <div style:width="{split.electrical}%" style:background="var(--color-elec)"></div>
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
