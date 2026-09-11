<!--
  Shown only on the staging clone (__APP_ENV__, set by the staging build
  command) so it's never mistaken for the production app — staging shares
  production's per-user config document, so this is the only visual cue that
  a change here is a real change.
-->
<div class="badge label-caps">Staging</div>

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
    background: var(--color-state-orange);
    color: var(--color-canvas);
    pointer-events: none;
  }
</style>
