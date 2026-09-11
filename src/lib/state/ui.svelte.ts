import { sessionState } from './session.svelte';

/**
 * Tabs, not routes: the app ships as static files with no router, and every
 * screen is a peer of the map rather than a place you can deep-link to.
 */
export const TABS = ['map', 'plan', 'search', 'saved', 'info', 'account'] as const;
export type Tab = (typeof TABS)[number];

/**
 * The bar holds five slots. Signed out, Saved and Search have nothing to show,
 * so Info takes the middle slot; signed in, Info moves into Account.
 */
const SIGNED_OUT_TABS: Tab[] = ['map', 'plan', 'info', 'account'];
const SIGNED_IN_TABS: Tab[] = ['map', 'plan', 'search', 'saved', 'account'];

class UiState {
  tab = $state<Tab>('map');
  /** Station whose detail sheet is open on the Map screen; null shows the
   *  "Around here" nearby list instead of a station. Independent of whether
   *  the sheet itself is open — see `sheetOpen`. */
  selectedStationId = $state<number | null>(null);
  /** Whether the detail sheet is visible at all. Off by default; a marker or
   *  the infobar opens it, the grabber or a downward drag closes it. */
  sheetOpen = $state(false);
  searchQuery = $state('');

  readonly visibleTabs = $derived(sessionState.signedIn ? SIGNED_IN_TABS : SIGNED_OUT_TABS);

  go(tab: Tab): void {
    this.tab = tab;
  }

  /** Opens the sheet on a station (id given) or the nearby list (null, e.g. the infobar tap). */
  select(stationId: number | null): void {
    this.selectedStationId = stationId;
    this.sheetOpen = true;
  }

  closeSheet(): void {
    this.sheetOpen = false;
  }
}

export const uiState = new UiState();
