import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import TabBar from './TabBar.svelte';
import { sessionState } from '$lib/state/session.svelte';
import { uiState } from '$lib/state/ui.svelte';

describe('TabBar', () => {
  beforeEach(() => {
    sessionState.user = null;
    uiState.go('map');
  });

  it('offers Info instead of Search and Saved while signed out', () => {
    render(TabBar);
    expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Saved' })).not.toBeInTheDocument();
  });

  it('swaps Info for Search and Saved once signed in', () => {
    sessionState.user = { id: 'u1', email: 'rider@negre.co' };
    render(TabBar);
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Info' })).not.toBeInTheDocument();
  });

  it('marks the active tab and switches on click', async () => {
    const user = userEvent.setup();
    render(TabBar);

    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Plan' }));

    expect(uiState.tab).toBe('plan');
    expect(screen.getByRole('button', { name: 'Plan' })).toHaveAttribute('aria-current', 'page');
  });
});
