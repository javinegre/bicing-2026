<script lang="ts">
  import { availabilitySplit } from '$lib/domain/station';
  import type { Station } from '$lib/domain/types';

  interface Props {
    station: Pick<Station, 'mechanical' | 'electrical' | 'docks'>;
    /** The count in the middle — bikes or docks, depending on what's shown. */
    value: number;
    label: string;
  }

  const { station, value, label }: Props = $props();
  const split = $derived(availabilitySplit(station));

  // conic-gradient wants cumulative turns, not segment widths.
  const mechTurn = $derived(split.mechanical / 100);
  const elecTurn = $derived(mechTurn + split.electrical / 100);
</script>

<div
  class="ring"
  style:background="conic-gradient(var(--color-mech) 0turn {mechTurn}turn, var(--color-elec) {mechTurn}turn
  {elecTurn}turn, rgba(255,255,255,.18) {elecTurn}turn 1turn)"
>
  <div class="hub">
    <span class="value" data-count>{value}</span>
    <span class="label-caps hub-label">{label}</span>
  </div>
</div>

<style>
  .ring {
    width: 78px;
    height: 78px;
    flex: none;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hub {
    width: 62px;
    height: 62px;
    border-radius: 9999px;
    background: var(--color-sheet);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .value {
    font-family: var(--font-condensed);
    font-weight: 500;
    font-size: 26px;
    line-height: 0.9;
  }

  .hub-label {
    color: var(--color-ink-secondary);
    margin-top: 3px;
  }
</style>
