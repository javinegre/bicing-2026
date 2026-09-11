import { sessionState } from './session.svelte';
import { buildUrl, readSearchQuery, tabFromPath, type Tab } from '$lib/domain/routes';

export type { Tab };

/**
 * The bar holds five slots. Signed out, Saved and Search have nothing to show,
 * so Info takes the middle slot; signed in, Info moves into Account.
 */
const SIGNED_OUT_TABS: Tab[] = ['map', 'plan', 'info', 'account'];
const SIGNED_IN_TABS: Tab[] = ['map', 'plan', 'search', 'saved', 'account'];

/**
 * Which tab is showing, kept in sync with the URL via the History API.
 * `$lib/domain/routes` owns the path/tab/query mapping; this class owns
 * *when* to read or write it: `go`/`setSearchQuery` are user-initiated and
 * write history (push or replace respectively); `syncFromLocation` only
 * mirrors state from a location the browser already navigated to (popstate,
 * or the initial load) and must never itself call pushState/replaceState.
 */
class UiState {
  tab = $state<Tab>(tabFromPath(window.location.pathname, import.meta.env.BASE_URL));
  /** Station whose detail sheet is open on the Map screen; null shows the
   *  "Around here" nearby list instead of a station. Independent of whether
   *  the sheet itself is open — see `sheetOpen`. */
  selectedStationId = $state<number | null>(null);
  /** Whether the detail sheet is visible at all. Off by default; a marker or
   *  the infobar opens it, the grabber or a downward drag closes it. */
  sheetOpen = $state(false);
  searchQuery = $state(readSearchQuery(window.location.search));

  readonly visibleTabs = $derived(sessionState.signedIn ? SIGNED_IN_TABS : SIGNED_OUT_TABS);

  /** User-initiated navigation (TabBar, "See all", bookmark jumps). No-ops on
   *  the already-active tab so repeat taps don't spam history. */
  go(tab: Tab): void {
    if (tab === this.tab) return;
    this.tab = tab;
    this.pushLocation();
  }

  /** Every keystroke in the search box. Replaces rather than pushes — a new
   *  history entry per character would make the back button unusable. */
  setSearchQuery(query: string): void {
    this.searchQuery = query;
    if (this.tab === 'search') this.replaceLocation();
  }

  /** Mirrors a location the browser already owns (back/forward, or the
   *  initial URL) into state. Must never write history itself. */
  syncFromLocation(): void {
    this.tab = tabFromPath(window.location.pathname, import.meta.env.BASE_URL);
    this.searchQuery = readSearchQuery(window.location.search);
  }

  /** A tab that isn't in `visibleTabs` for this session (signed-out deep
   *  link to /search, or a sign-out while sitting on Saved) lands here.
   *  Replaces: the invalid URL should not be a back-button stop. */
  redirectToMap(): void {
    this.tab = 'map';
    this.replaceLocation();
  }

  /** Opens the sheet on a station (id given) or the nearby list (null, e.g. the infobar tap). */
  select(stationId: number | null): void {
    this.selectedStationId = stationId;
    this.sheetOpen = true;
  }

  closeSheet(): void {
    this.sheetOpen = false;
  }

  private pushLocation(): void {
    history.pushState(null, '', buildUrl(this.tab, this.searchQuery, import.meta.env.BASE_URL));
  }

  private replaceLocation(): void {
    history.replaceState(null, '', buildUrl(this.tab, this.searchQuery, import.meta.env.BASE_URL));
  }
}

export const uiState = new UiState();
