<script lang="ts">
  /*
   * Shown on any non-production build (__APP_ENV__, set by the build
   * command) so it's never mistaken for the real app — staging shares
   * production's per-user config document, so this is the only visual cue
   * that a change there is a real change.
   */
  const { env }: { env: 'staging' | 'development' } = $props();

  const label = $derived(env === 'staging' ? 'Staging' : 'Dev');
</script>

<div
  class="badge label-caps"
  class:staging={env === 'staging'}
  class:development={env === 'development'}
>
  {label}
</div>

<style>
  .badge {
    position: fixed;
    top: env(safe-area-inset-top, 0px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    margin-top: 6px;
    padding: 3px 10px;
    border-radius: 9999px;
    color: var(--color-canvas);
    pointer-events: none;
  }

  .staging {
    background: var(--color-state-orange);
  }

  .development {
    background: var(--color-state-gray);
  }
</style>
