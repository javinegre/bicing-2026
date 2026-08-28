/**
 * The better-auth session, read from negre.co's shared auth handler. The app
 * works signed out — an account only buys you preferences that follow you
 * between devices — so this never blocks rendering.
 */
export interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

const SESSION_URL = '/api/auth/get-session';

class SessionState {
  user = $state<SessionUser | null>(null);
  status = $state<'idle' | 'loading' | 'ready'>('idle');

  get signedIn(): boolean {
    return this.user !== null;
  }

  /** Initials for the Account avatar; falls back to the first letter of the email. */
  get initials(): string {
    const source = this.user?.name ?? this.user?.email ?? '';
    const [local = ''] = source.split('@');
    const parts = local.split(/[.\-_ ]+/).filter(Boolean);
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('') ||
      local[0] ||
      '?'
    ).toUpperCase();
  }

  async load(): Promise<void> {
    this.status = 'loading';
    try {
      const res = await fetch(SESSION_URL, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const data = res.ok ? ((await res.json()) as { user?: SessionUser } | null) : null;
      this.user = data?.user ?? null;
    } catch {
      // Offline or the router isn't reachable: stay signed out rather than
      // trapping the user behind an error they cannot act on.
      this.user = null;
    }
    this.status = 'ready';
  }
}

export const sessionState = new SessionState();
