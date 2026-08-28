<script lang="ts">
  import DetailSheet from '$lib/components/DetailSheet.svelte';
  import InfoBar from '$lib/components/InfoBar.svelte';
  import MapCanvas from '$lib/components/MapCanvas.svelte';
  import MapControls from '$lib/components/MapControls.svelte';
</script>

<div class="screen">
  <MapCanvas />
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
