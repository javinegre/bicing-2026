<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { sessionState } from '$lib/state/session.svelte';
  import { uiState } from '$lib/state/ui.svelte';

  /** Stamped at build time so a bug report can name the exact bundle. */
  const build = __APP_ENV__ === 'staging' ? `${__APP_VERSION__} (staging)` : __APP_VERSION__;

  /**
   * Login and logout live in negre.co's shared auth app, not here — there is no
   * password or passkey UI in this bundle at all.
   */
  const loginUrl = `/login?next=${encodeURIComponent(window.location.pathname)}`;

  async function logOut() {
    await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    await sessionState.load();
  }
</script>

<div class="screen">
  <header class="head">
    <h1>Account</h1>
    {#if !sessionState.signedIn}
      <p>Sign in to sync your saved places across devices</p>
    {/if}
  </header>

  {#if sessionState.signedIn && sessionState.user}
    <div class="identity">
      <div class="avatar gradient-accent">{sessionState.initials}</div>
      <div class="who">
        <div class="email">{sessionState.user.email}</div>
        <div class="sub">Settings follow this account</div>
      </div>
    </div>

    <div class="rows">
      <button type="button" class="row" onclick={() => uiState.go('info')}>
        <span class="tile"><Icon name="info" size={20} /></span>
        <span class="text">
          <span class="title">How to read the map</span>
          <span class="body">Icons and colours explained</span>
        </span>
        <Icon name="chevron-right" size={16} />
      </button>

      <div class="row static">
        <span class="text"><span class="body">Version</span></span>
        <code>{build}</code>
      </div>

      <button type="button" class="outline-button" onclick={logOut}>Log out</button>
    </div>
  {:else}
    <div class="signed-out">
      <div class="avatar hollow"><Icon name="tab-account" size={32} /></div>
      <div class="pitch">
        <div class="pitch-title">You're not signed in</div>
        <div class="pitch-body">Your saved places live on this device until you do.</div>
      </div>
      <a class="primary gradient-accent" href={loginUrl}>Log in</a>
      <p class="fine">Accounts are invite only.</p>
    </div>
  {/if}
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

  .identity {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 24px;
  }

  .avatar {
    width: 56px;
    height: 56px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 20px;
  }

  .avatar.hollow {
    width: 76px;
    height: 76px;
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
    color: var(--color-ink-secondary);
  }

  .who {
    min-width: 0;
  }

  .email {
    font-weight: 600;
    font-size: 17px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sub {
    font-size: 12.5px;
    line-height: 1.3;
    color: var(--color-ink-label);
    margin-top: 3px;
  }

  .rows {
    margin-top: 26px;
    border-top: 1px solid var(--color-hairline);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 13px;
    width: 100%;
    padding: 15px 0;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--color-hairline);
    color: var(--color-ink);
    text-align: left;
    cursor: pointer;
  }

  .row.static {
    cursor: default;
    justify-content: space-between;
  }

  .tile {
    width: 44px;
    height: 44px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    background: var(--color-panel);
    border: 1px solid var(--color-hairline);
  }

  .text {
    flex: 1;
    min-width: 0;
  }

  .title {
    display: block;
    font-weight: 600;
    font-size: 15px;
    line-height: 1.2;
  }

  .body {
    display: block;
    font-size: 12.5px;
    line-height: 1.35;
    color: var(--color-ink-label);
    margin-top: 3px;
  }

  code {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-ink-secondary);
  }

  .outline-button {
    display: block;
    width: 100%;
    height: 46px;
    margin-top: 26px;
    border-radius: var(--radius-sheet);
    border: 1px solid var(--color-hairline);
    background: none;
    color: var(--color-ink-secondary);
    font-family: inherit;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
  }

  .signed-out {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding-top: 28px;
  }

  .pitch {
    text-align: center;
    max-width: 250px;
  }

  .pitch-title {
    font-weight: 600;
    font-size: 18px;
    line-height: 1.25;
  }

  .pitch-body {
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-ink-label);
    margin-top: 6px;
  }

  .primary {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 50px;
    border-radius: 25px;
    color: var(--color-ink);
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
  }

  .fine {
    margin: 0;
    font-size: 12px;
    color: var(--color-ink-label);
  }
</style>
