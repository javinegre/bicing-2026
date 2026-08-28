<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { getMarkerIconUrl } from '$lib/icons/marker-icon';
  import type { IconName } from '$lib/icons';
  import type { StateColor } from '$lib/domain/types';

  const GLYPHS: { icon: IconName; size: number; title: string; body: string }[] = [
    { icon: 'bike', size: 24, title: 'Bikes', body: 'Bikes ready to take at a station.' },
    {
      icon: 'bike',
      size: 20,
      title: 'Mechanical',
      body: 'Pedal-only bikes. Free for subscribers.',
    },
    { icon: 'bolt', size: 15, title: 'Electric', body: 'Pedal-assist bikes. Charged per trip.' },
    {
      icon: 'parking',
      size: 19,
      title: 'Docks',
      body: 'Empty docks where you can return a bike.',
    },
  ];

  /** Mirrors the thresholds in domain/station.ts — if those move, move these. */
  const SCALE: { color: StateColor; title: string; body: string }[] = [
    { color: 'green', title: '6 or more bikes', body: 'Plenty available.' },
    { color: 'orange', title: '3 to 5 bikes', body: 'Going fast, check again before you walk.' },
    { color: 'red', title: '1 or 2 bikes', body: 'Almost empty.' },
    { color: 'black', title: 'No bikes', body: 'Working, but nothing to take right now.' },
    { color: 'gray', title: 'Out of service', body: 'Station closed or reporting no data.' },
  ];
</script>

<div class="screen">
  <header class="head">
    <h1>How to read the map</h1>
    <p>What every icon and colour stands for.</p>
  </header>

  <div class="label-caps section">Icons</div>
  {#each GLYPHS as glyph (glyph.title)}
    <div class="row">
      <div class="tile"><Icon name={glyph.icon} size={glyph.size} /></div>
      <div class="text">
        <div class="title">{glyph.title}</div>
        <div class="body">{glyph.body}</div>
      </div>
    </div>
  {/each}

  <div class="label-caps section">Marker colour · docks use the same scale</div>
  {#each SCALE as step (step.color)}
    <div class="row">
      <img class="marker" src={getMarkerIconUrl('bikes', 'big', step.color)} alt="" />
      <div class="text">
        <div class="title">{step.title}</div>
        <div class="body">{step.body}</div>
      </div>
    </div>
  {/each}

  <div class="label-caps section">Availability bar</div>
  <div class="demo-bar">
    <div style:flex="12" style:background="var(--color-mech)"></div>
    <div style:flex="4" style:background="var(--color-elec)"></div>
    <div style:flex="6" style:background="var(--color-track)"></div>
  </div>
  <div class="keys">
    <span><i style:background="var(--color-mech)"></i>Mech</span>
    <span><i style:background="var(--color-elec)"></i>Elec</span>
    <span><i style:background="var(--color-track)"></i>Docks</span>
  </div>
</div>

<style>
  .screen {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 22px 16px 24px;
    background: var(--color-canvas);
  }

  h1 {
    margin: 0;
    font-weight: 600;
    font-size: 30px;
    line-height: 1;
    letter-spacing: -0.015em;
  }

  .head p {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--color-ink-label);
  }

  .section {
    margin: 20px 0 4px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 9px 0;
    border-bottom: 1px solid var(--color-hairline);
  }

  .tile {
    width: 44px;
    height: 44px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-surface);
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
  }

  .marker {
    width: 26px;
    height: 29px;
    flex: none;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
  }

  .text {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-weight: 600;
    font-size: 15px;
    line-height: 1.2;
  }

  .body {
    font-size: 12.5px;
    line-height: 1.35;
    color: var(--color-ink-label);
    margin-top: 3px;
  }

  .demo-bar {
    display: flex;
    height: 5px;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 6px;
  }

  .keys {
    display: flex;
    gap: 16px;
    margin-top: 9px;
  }

  .keys span {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 500;
    font-size: 13px;
  }

  .keys i {
    width: 11px;
    height: 11px;
    border-radius: 3px;
  }
</style>
