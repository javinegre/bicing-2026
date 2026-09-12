<script lang="ts">
  import Icon from './Icon.svelte';
  import { NEARBY_RADIUS_M, metersToPixels } from '$lib/domain/distance';
  import { mapState } from '$lib/state/map.svelte';
  import { uiState } from '$lib/state/ui.svelte';

  /**
   * The circle always spans the same ground distance the info bar totals and
   * the "N min away" labels use, so it has to be resized in screen pixels on
   * every pan/zoom rather than drawn once.
   */
  const diameter = $derived(
    metersToPixels(NEARBY_RADIUS_M * 2, mapState.center.lat, mapState.zoom),
  );

  /**
   * With the sheet open, the hint has to centre in the band still visible
   * above it — centring on the full screen would put it half-hidden under
   * the sheet. `sheetHeight` is the sheet's real rendered height (it only
   * grows to fit its content, not to its CSS `54%` cap), so this tracks the
   * sheet's actual top rather than assuming it is always at the cap.
   */
  const sheetInset = $derived(uiState.sheetOpen ? uiState.sheetHeight : 0);
</script>

<div class="hints" style:bottom="{sheetInset}px">
  <div class="nearby" style:width="{diameter}px" style:height="{diameter}px"></div>
  <div class="crosshair">
    <Icon name="crosshair" size={16} />
  </div>
</div>

<style>
  /* Fixed relative to the viewport, not a real map shape — it marks the point
     the map is centred on, which is what the nearby totals are computed
     around, so it must never pan or scale with the tiles underneath it. */
  .hints {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: bottom 0.2s ease;
  }

  .nearby {
    position: absolute;
    border-radius: 50%;
    border: 1px dashed var(--color-geo);
    opacity: 0.4;
  }

  .crosshair {
    position: absolute;
    color: var(--color-geo);
  }
</style>
