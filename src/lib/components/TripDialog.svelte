<script lang="ts">
  import { Dialog } from 'bits-ui';
  import Icon from './Icon.svelte';
  import { tripsState } from '$lib/state/trips.svelte';
  import type { Station } from '$lib/domain/types';

  const MAX_LABEL_LENGTH = 60;

  let {
    open = $bindable(false),
    origin,
    destination,
    trip = null,
    onsaved,
  }: {
    open: boolean;
    origin: Station;
    destination: Station;
    /** Present to rename an existing trip; absent to create a new one. */
    trip?: { id: string; label: string } | null;
    onsaved?: () => void;
  } = $props();

  let label = $state('');

  /** Reset each time the dialog opens, rather than carrying the previous
      trip's edited text into the next one. */
  $effect(() => {
    if (open) label = trip ? trip.label : `${origin.name} to ${destination.name}`;
  });

  async function submit(): Promise<void> {
    const trimmed = label.trim();
    if (!trimmed) return;
    const ok = trip
      ? await tripsState.rename(trip.id, origin.id, destination.id, trimmed)
      : await tripsState.save(origin.id, destination.id, trimmed);
    if (ok) {
      open = false;
      onsaved?.();
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="trip-overlay" />
    <Dialog.Content class="trip-dialog">
      <div class="trip-head">
        <Dialog.Title class="trip-title">{trip ? 'Rename trip' : 'Save trip'}</Dialog.Title>
        <Dialog.Close class="trip-close" aria-label="Close">
          <Icon name="close" size={14} />
        </Dialog.Close>
      </div>
      <Dialog.Description class="trip-route">
        {origin.name} → {destination.name}
      </Dialog.Description>

      <label class="label-caps trip-field" for="trip-label">Label</label>
      <input
        id="trip-label"
        class="trip-input"
        type="text"
        bind:value={label}
        maxlength={MAX_LABEL_LENGTH}
        placeholder="Home to work"
        autocomplete="off"
      />

      {#if tripsState.error}
        <p class="trip-error">{tripsState.error}</p>
      {/if}

      <div class="trip-actions">
        <Dialog.Close class="trip-cancel">Cancel</Dialog.Close>
        <button
          type="button"
          class="trip-save gradient-accent"
          disabled={!label.trim() || tripsState.saving}
          onclick={submit}
        >
          {tripsState.saving ? 'Saving…' : trip ? 'Rename trip' : 'Save trip'}
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.trip-overlay) {
    position: fixed;
    inset: 0;
    z-index: 10;
    background: rgba(0, 0, 0, 0.6);
  }

  :global(.trip-dialog) {
    position: fixed;
    z-index: 11;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: calc(100% - 32px);
    max-width: 380px;
    box-sizing: border-box;
    padding: 20px;
    border-radius: var(--radius-surface);
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
    box-shadow: var(--shadow-sheet);
  }

  .trip-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  :global(.trip-title) {
    margin: 0;
    font-weight: 600;
    font-size: 18px;
    line-height: 1;
  }

  :global(.trip-close) {
    width: 28px;
    height: 28px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    border: 1px solid var(--color-hairline);
    background: none;
    color: var(--color-ink-secondary);
    cursor: pointer;
  }

  :global(.trip-route) {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--color-ink-secondary);
  }

  .trip-field {
    display: block;
    margin: 18px 0 8px;
  }

  .trip-input {
    display: block;
    width: 100%;
    height: 44px;
    padding: 0 14px;
    box-sizing: border-box;
    border-radius: var(--radius-surface);
    border: 1px solid var(--color-hairline);
    background: var(--color-canvas);
    color: var(--color-ink);
    font-family: inherit;
    font-size: 15px;
  }

  .trip-input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
  }

  .trip-error {
    margin: 10px 0 0;
    font-size: 12.5px;
    color: var(--color-accent);
  }

  .trip-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  :global(.trip-cancel) {
    height: 40px;
    padding: 0 16px;
    border-radius: 9999px;
    border: 1px solid var(--color-hairline);
    background: none;
    color: var(--color-ink-secondary);
    font-family: inherit;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
  }

  .trip-save {
    height: 40px;
    padding: 0 18px;
    border: 0;
    border-radius: 9999px;
    color: var(--color-ink);
    font-family: inherit;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }

  .trip-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
