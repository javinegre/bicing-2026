<script lang="ts">
  import DetailSheet from '$lib/components/DetailSheet.svelte';
  import InfoBar from '$lib/components/InfoBar.svelte';
  import MapCanvas from '$lib/components/MapCanvas.svelte';
  import MapControls from '$lib/components/MapControls.svelte';
  import MapHints from '$lib/components/MapHints.svelte';
  import { geoState } from '$lib/state/geo.svelte';

  // The marker and the ring are both on this screen, so a session outliving it
  // would poll the GPS for up to 30 minutes with nothing to show and no way to
  // stop it.
  $effect(() => () => geoState.stop());
</script>

<div class="screen">
  <MapCanvas />
  <MapHints />
  <InfoBar />
  <MapControls />
  <DetailSheet />
</div>

<style>
  .screen {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
