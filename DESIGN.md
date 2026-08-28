# DESIGN.md — Bicing 2026

The visual source of truth is the Claude Design handoff in
`initial-context/Bicing-app-26-handoff.zip`. Inside it, `Bicing Refresh.dc.html`
holds three turns:

| Turn              | What it is                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **1** (`1a`–`1e`) | Three competing directions for the map, plus first drafts of Search and Saved. Superseded.                                               |
| **2** (`2a`–`2k`) | The merged direction. **This is the screen inventory** — Map, Search, Saved, Account (signed out and in), Info, and Plan in four states. |
| **3** (`3a`–`3d`) | A consistency pass. `3a` states the token scale; `3b`/`3c`/`3d` re-cut Map/Search/Info onto it.                                          |

**Read turn 2 for structure and turn 3 for values.** Where they disagree, turn 3
wins — it exists precisely to collapse the drift turn 2 accumulated. The screens
turn 3 did not re-cut (Saved, Account, Plan) still get turn 3's tokens applied.

Everything below is implemented in `src/app.css` under `@theme`. If a value here
and a value in that file ever disagree, the CSS is wrong.

## Tokens

### Surfaces

| Token             | Value                | Used for                                                     |
| ----------------- | -------------------- | ------------------------------------------------------------ |
| `--color-tabbar`  | `#0d0b0b`            | The bottom tab bar only                                      |
| `--color-canvas`  | `#100d0d`            | Full-screen background of every non-map screen               |
| `--color-sheet`   | `#141010`            | The map's bottom sheet, and the hub of the availability ring |
| `--color-panel`   | `#171313`            | Raised panels: search field, cards, icon tiles               |
| `--color-grabber` | `#4a4240`            | The sheet's drag handle                                      |
| `--color-divider` | `#3a3232`            | The 6 px rule between the two halves of Plan                 |
| glass control     | `rgba(16,13,13,.88)` | Chrome floating over map tiles (`control-glass` utility)     |

### Hairlines

**One value: `rgba(255,255,255,.12)`** (`--color-hairline`). Turn 2 had seven
(.07/.1/.12/.14/.16/.18/.2); turn 3a collapsed them. Every border, divider and
row rule uses this and nothing else.

### Text

Three greys, three jobs. Anything between them is drift.

| Token                   | Value                   | Job                                                 |
| ----------------------- | ----------------------- | --------------------------------------------------- |
| `--color-ink`           | `#ffffff`               | Primary — names, counts, headings                   |
| `--color-ink-secondary` | `rgba(255,255,255,.72)` | Secondary — supporting lines, outline-button labels |
| `--color-ink-label`     | `rgba(255,255,255,.42)` | Labels, captions, muted counts                      |

### Accent

**One red: `#ff224a`** (`--color-accent`). Turn 2 used `#ff3b52` in tab bars and
`#ff224a` everywhere else; turn 3a merged them.

The gradient `linear-gradient(135deg, #c11104 0%, #ff224a 100%)` is reserved for
**primary actions and active state** — the info bar, the geolocate button, the
active half of the resource switch, a saved star, the Plan swap button, the Log
in button. It is not a decorative fill. Available as the `gradient-accent`
utility.

### Radii

Three, not ten.

- **Surfaces: 16px** (`--radius-surface`) — cards, icon tiles, the info bar, control groups
- **Pills: fully round** (`9999px`) — chips, the resource switch, circular buttons
- **Sheets: 23px** (`--radius-sheet`) — the map's bottom sheet, the search field

### Typography

Two families, both loaded from Google Fonts in `index.html`:

- **Barlow** (400/500/600/700) — body, names, buttons
- **Barlow Condensed** (300/500/600) — every number that needs to be scanned, and the label style

| Role                  | Spec                                                  |
| --------------------- | ----------------------------------------------------- |
| Screen title          | Barlow 600 / 30px / 1 / `-.015em`                     |
| Screen subtitle       | Barlow 400 / 13px / 1.4 / `--color-ink-label`         |
| Station name (detail) | Barlow 600 / 21px / 1.15 / `-.01em`                   |
| Station name (list)   | Barlow 500 / 15–16px / 1.2                            |
| Row body / caption    | Barlow 400 / 12–12.5px / 1.35                         |
| Tab label             | Barlow 600 / 10px / 1                                 |
| **Small-caps label**  | **Barlow Condensed 300 / 10px / `.16em` / uppercase** |
| Big count             | Barlow Condensed 500 / 22–32px                        |
| List count            | Barlow Condensed 500 / 15–17px                        |

**One label style.** Turn 2 used Barlow Condensed at 8, 9, 10 and 11px with
tracking of both `.14em` and `.16em`. Turn 3a collapsed all of it into the single
`label-caps` utility above. Use that utility; do not hand-roll a variant.

**Tabular figures on every count.** Counts refresh every 60 s and sit in columns;
proportional digits make them jitter. The `[data-count]` attribute applies
`font-variant-numeric: tabular-nums` — put it on any element showing a number.

## Data colours

These are not part of the neutral scale — they encode meaning and must not be
re-themed.

| Meaning                         | Token           | Value                   |
| ------------------------------- | --------------- | ----------------------- |
| Mechanical bikes                | `--color-mech`  | `#FF0000`               |
| Electric bikes                  | `--color-elec`  | `#FFCC00`               |
| Free docks (solid)              | `--color-dock`  | `#808080`               |
| Free docks (as remaining track) | `--color-track` | `rgba(255,255,255,.16)` |
| User location furniture         | `--color-geo`   | `#406090`               |

### Marker / status scale

One scale, used by the map markers, the list dots and the Info legend. Thresholds
live in `src/lib/domain/station.ts`; the swatches live in
`src/lib/icons/marker-icon.ts` and as `--color-state-*` tokens.

| Count | Colour    | Token                  | Reads as                 |
| ----- | --------- | ---------------------- | ------------------------ |
| 6+    | `#AACC22` | `--color-state-green`  | Plenty available         |
| 3–5   | `#FF9900` | `--color-state-orange` | Going fast               |
| 1–2   | `#DD0033` | `--color-state-red`    | Almost empty             |
| 0     | `#222222` | `--color-state-black`  | Working, nothing to take |
| —     | `#BBBBBB` | `--color-state-gray`   | Out of service           |

Docks use the same scale against the free-dock count. Out of service wins over
every count: a closed station's numbers are not trustworthy.

In lists the `0` state is drawn as a 2px outlined ring rather than a filled disc
— on `#141010`, a `#222` dot reads as a hole (`StateDot.svelte`).

## Screens

### Map (`2a` → `3b`)

Full-bleed map. Floating chrome, bottom to top:

- **Info bar** — top `14px`, inset `12px`, height `58px`, gradient, radius 16.
  Nearby totals for the ~340 m circle: total bikes, a mech chip, an elec chip,
  and free docks right-aligned on a `rgba(0,0,0,.2)` pill. Tapping a chip filters
  the map to that drivetrain. **Selected filters are filled chips, not reduced
  opacity** — opacity read as "disabled" in the 2023 app.
- **Resource switch** — top `84px`, right `12px`. An 88×46 pill; the active half
  is a 40px gradient circle. Bikes ⇄ docks.
- **Control stacks** — top `150px`, right `12px`: a 44px gradient geolocate
  button, then two 44px-wide glass groups (zoom ±, and home/work/favorite).
  A bookmark that is set pans to it; one that is not is set from the map centre.
- **Detail sheet** — bottom, radius 23 top corners, `--color-sheet`, grabber
  44×4. With a station selected: 78px availability ring, name, "N min away ·
  updated N s ago", mech/elec/free legend, save and plan buttons. Then "Closest
  stations" and five rows.

### Search (`2b` → `3c`)

48px search field (radius 23), three bookmark chips (unset ones dashed at 55%
opacity), a `label-caps` result count, then result rows: dot, name, `#id · N min
away`, a 120px availability bar, the bike count with a `bikes` label, a save star
and a plan button.

### Saved (`2c`)

A card per bookmarked **place** (a place, not a station) showing the best station
near it right now, plus a dashed placeholder for any unset place. Below,
"Saved stations" — individually starred stations.

### Info (`2e` → `3d`)

Legend. Icon meanings, then the five-step marker scale rendered from the live
templates, then the availability bar with its keys.

### Account (`2d` signed out, `2f` signed in)

Signed out: hollow avatar, "You're not signed in", a gradient **Log in** button
pointing at negre.co's shared `/login`, and "Accounts are invite only."

Signed in: gradient initials avatar, email, a row into Info, the build commit in
monospace, and an outlined **Log out**.

### Plan (`2g`–`2k`)

Two stacked halves: origin over a bikes map, destination over a docks map.

- Neither set → 50/50, no Cancel, no swap button; each half shows a gradient CTA.
- Both set → the leading half takes **65%**, the other 35%; a 44px gradient swap
  button rides the divider at `calc(topGrow% - 22px)`.
- Tapping a half makes it lead. Swap flips which one leads.
- **Cancel keeps the origin** and clears the destination — you are usually still
  starting from the same place.
- Transitions: `flex .35s cubic-bezier(.4,0,.2,1)` on the halves, `top` on the
  swap button, same curve.

The maps inside the halves are not built yet; the hatched fill from the design's
empty state stands in for the tiles.

## Tab bar

60px tall, `#0d0b0b`, `padding-bottom: 6px` for the home indicator. Inactive tabs
sit at 45% opacity; the active tab is full opacity in `--color-accent`.

Five slots, and **which five depends on the session**:

- Signed out: Map · Plan · **Info** · Account
- Signed in: Map · Plan · Search · Saved · Account — Info moves into Account

Search and Saved have nothing to show without an account, and Info has to stay
reachable, so it takes the free slot.

## Conventions worth keeping

- `label-caps` and `gradient-accent` are utilities, not copy-paste CSS.
- Every number gets `data-count`.
- Icons are inlined as raw SVG so one `color` drives fill and stroke; that is
  what lets the tab bar render the same glyph white and accent-red.
